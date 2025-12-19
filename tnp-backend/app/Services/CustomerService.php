<?php

namespace App\Services;

use App\Contracts\Repositories\CustomerRepositoryInterface;
use App\Models\MasterCustomer as Customer;
use App\Models\CustomerDetail;
use App\Models\RelationCustomerUser as CustomerUser;
use App\Models\MasterCustomerGroup as CustomerGroup;
use App\Helpers\AccountingHelper;
use App\Models\CustomerTransferHistory;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Customer Service
 * 
 * จัดการ Business Logic ทั้งหมดสำหรับ Customer
 * Controller ควรเรียกใช้ Service นี้แทนการจัดการ logic โดยตรง
 */
class CustomerService
{
    /**
     * Fields to clean (remove non-numeric characters)
     */
    protected array $numericFields = ['cus_tel_1', 'cus_tel_2', 'cus_tax_id'];

    /**
     * Create a new service instance
     */
    public function __construct(
        protected CustomerRepositoryInterface $customerRepository,
        protected AddressService $addressService
    ) {}

    // =========================================================================
    // CRUD Operations
    // =========================================================================

    /**
     * Create a new customer with detail and relation
     * 
     * @param array $data Customer data from request
     * @return Customer
     * @throws \Exception
     */
    public function createCustomer(array $data): Customer
    {
        return DB::transaction(function () use ($data) {
            // Clean phone & tax ID
            $data = $this->cleanNumericFields($data);
            
            // Get default grade (D - mcg_sort = 4)
            $group = $this->getDefaultCustomerGroup();
            
            // Get latest customer number
            $lastNo = $this->customerRepository->getLatestCustomerNo();
            
            // Create customer
            $customer = new Customer();
            $customer->fill($data);
            $customer->cus_id = Str::uuid();
            $customer->cus_no = $this->genCustomerNo($lastNo);
            $customer->cus_mcg_id = $group->mcg_id;
            
            // Set source and allocation status
            $customer->cus_source = $data['cus_source'] ?? 
                (AccountingHelper::isTelesales() ? 'telesales' : 'sales');
            
            $customer->cus_allocation_status = $data['cus_allocation_status'] ?? 
                (AccountingHelper::isTelesales() ? 'pool' : 'allocated');
            
            // Set manager based on allocation status
            if ($customer->cus_allocation_status === 'pool') {
                $customer->cus_manage_by = null;
            } else {
                $customer->cus_manage_by = $this->extractManagerId($data['cus_manage_by'] ?? null);
            }
            
            $customer->cus_created_date = now();
            $customer->cus_created_by = Auth::id();
            $customer->cus_updated_date = now();
            $customer->cus_updated_by = Auth::id();

            // Handle address
            $this->handleAddressUpdate($customer, $data);

            $customer->save();
            
            // Create customer detail
            $this->createCustomerDetail($customer, $data, $group);
            
            // Create relation if allocated
            if ($customer->cus_allocation_status === 'allocated' && $customer->cus_manage_by) {
                $this->createCustomerRelation($customer);
            }
            
            // Create initial history record (for tracking from creation)
            $this->createInitialHistory($customer);
            
            return $customer;
        });
    }

    /**
     * Update existing customer
     * 
     * @param string $id Customer UUID
     * @param array $data Updated data
     * @return Customer
     * @throws \Exception
     */
    public function updateCustomer(string $id, array $data): Customer
    {
        return DB::transaction(function () use ($id, $data) {
            $data = $this->cleanNumericFields($data);
            
            $customer = $this->customerRepository->findOrFail($id);
            
            // Capture old state for history tracking
            $oldManageBy = $customer->cus_manage_by;
            $currentChannel = $customer->cus_channel;
            
            $customer->fill($data);
            $newManageBy = $this->extractManagerId($data['cus_manage_by'] ?? null);
            $customer->cus_manage_by = $newManageBy;
            $customer->cus_updated_date = now();
            $customer->cus_updated_by = Auth::id();

            // Handle address
            $this->handleAddressUpdate($customer, $data);

            $customer->save();
            
            // Record history if manager changed
            if ($oldManageBy !== $newManageBy) {
                $this->recordManagerChangeHistory(
                    $customer->cus_id,
                    $currentChannel,
                    $oldManageBy,
                    $newManageBy,
                    'เปลี่ยนผู้ดูแลจากการแก้ไขข้อมูล'
                );
            }
            
            // Update customer detail
            $this->updateCustomerDetail($id, $data);
            
            return $customer;
        });
    }

    /**
     * Soft delete customer (set is_use = 0)
     * 
     * @param string $id Customer UUID
     * @return bool
     * @throws \Exception
     */
    public function deleteCustomer(string $id): bool
    {
        return DB::transaction(function () use ($id) {
            $customer = $this->customerRepository->findOrFail($id);
            $customer->update([
                'cus_is_use' => 0,
                'cus_updated_date' => now(),
            ]);
            
            // Soft delete related records
            CustomerDetail::where('cd_cus_id', $id)->update([
                'cd_is_use' => 0,
                'cd_updated_date' => now(),
            ]);
            
            CustomerUser::where('rcs_cus_id', $id)->update([
                'rcs_is_use' => 0,
                'rcs_updated_date' => now(),
            ]);
            
            return true;
        });
    }

    // =========================================================================
    // Grade Management
    // =========================================================================

    /**
     * Change customer grade (up or down)
     * Grade progression: D → C → B → A (upgrade)
     * Grade regression: A → B → C → D (downgrade)
     * 
     * @param string $id Customer UUID
     * @param string $direction 'up' or 'down'
     * @return array ['old_grade' => string, 'new_grade' => string]
     * @throws \InvalidArgumentException
     * @throws \Exception
     */
    public function changeGrade(string $id, string $direction): array
    {
        return DB::transaction(function () use ($id, $direction) {
            $customer = $this->customerRepository->findOrFail($id);
            
            $currentGroup = CustomerGroup::where('mcg_id', $customer->cus_mcg_id)
                ->select('mcg_id', 'mcg_name', 'mcg_sort')
                ->firstOrFail();
            
            // Calculate target sort order
            $targetSort = $direction === 'up' 
                ? $currentGroup->mcg_sort - 1  // Move up (e.g., B → A)
                : $currentGroup->mcg_sort + 1; // Move down (e.g., B → C)
            
            $targetGroup = CustomerGroup::where('mcg_sort', $targetSort)
                ->where('mcg_is_use', true)
                ->select('mcg_id', 'mcg_name', 'mcg_recall_default')
                ->first();
            
            if (!$targetGroup) {
                throw new \InvalidArgumentException('Cannot change grade. Target grade not found.');
            }
            
            // Update customer's group
            $customer->cus_mcg_id = $targetGroup->mcg_id;
            $customer->cus_updated_date = now();
            $customer->cus_updated_by = Auth::id();
            $customer->save();
            
            // Update recall date based on new group's settings
            $this->updateRecallDate($id, $targetGroup->mcg_recall_default);
            
            return [
                'old_grade' => $currentGroup->mcg_name,
                'new_grade' => $targetGroup->mcg_name,
            ];
        });
    }

    // =========================================================================
    // Recall Management
    // =========================================================================

    /**
     * Recall customer with updated note/status
     * 
     * @param string $id CustomerDetail ID
     * @param array $data Updated data
     * @param string $groupId Customer group ID
     * @return CustomerDetail
     * @throws \Exception
     */
    public function recallCustomer(string $id, array $data, string $groupId): CustomerDetail
    {
        return DB::transaction(function () use ($id, $data, $groupId) {
            $group = CustomerGroup::where('mcg_id', $groupId)
                ->where('mcg_is_use', true)
                ->select('mcg_id', 'mcg_name', 'mcg_recall_default')
                ->firstOrFail();
            
            $detail = CustomerDetail::findOrFail($id);
            $detail->fill($data);
            $detail->cd_last_datetime = $this->setRecallDatetime($group->mcg_recall_default);
            $detail->cd_updated_date = now();
            $detail->cd_updated_by = Auth::id();
            $detail->save();
            
            return $detail;
        });
    }

    // =========================================================================
    // Pool & Allocation Management
    // =========================================================================

    /**
     * Assign customers from pool to a sales person
     * 
     * @param array $customerIds Array of customer UUIDs
     * @param int $salesUserId User ID to assign to
     * @param bool $force Force reassignment of already allocated customers
     * @return array ['success_count' => int, 'failed' => array]
     * @throws \Exception
     */
    public function assignCustomers(array $customerIds, int $salesUserId, bool $force = false): array
    {
        return DB::transaction(function () use ($customerIds, $salesUserId, $force) {
            $allocatorId = Auth::id();
            $successCount = 0;
            $failedCustomers = [];
            
            // Get customers
            $customers = Customer::whereIn('cus_id', $customerIds)->get();
            
            // Filter: if not force, only get pool customers
            if (!$force) {
                $customers = $customers->where('cus_allocation_status', 'pool');
            }
            
            foreach ($customers as $customer) {
                try {
                    // Capture previous manager before update
                    $previousManageBy = $customer->cus_manage_by;
                    $currentChannel = $customer->cus_channel;
                    
                    $customer->update([
                        'cus_allocation_status' => 'allocated',
                        'cus_manage_by' => $salesUserId,
                        'cus_allocated_by' => $allocatorId,
                        'cus_allocated_at' => now(),
                        'cus_updated_by' => $allocatorId,
                        'cus_updated_date' => now()
                    ]);

                    // Create relation
                    $rel = new CustomerUser();
                    $rel->rcs_cus_id = $customer->cus_id;
                    $rel->rcs_user_id = $salesUserId;
                    $rel->save();
                    
                    // Record assignment history
                    CustomerTransferHistory::create([
                        'id' => Str::uuid()->toString(),
                        'customer_id' => $customer->cus_id,
                        'previous_channel' => $currentChannel,
                        'new_channel' => $currentChannel, // Same channel, just manager change
                        'previous_manage_by' => $previousManageBy, // null if from pool
                        'new_manage_by' => $salesUserId,
                        'action_by_user_id' => $allocatorId,
                        'remark' => $previousManageBy ? 'เปลี่ยนผู้ดูแล' : 'จัดสรรจาก Pool',
                        'created_at' => now(),
                    ]);
                    
                    $successCount++;
                } catch (\Exception $e) {
                    Log::warning("Failed to assign customer {$customer->cus_id}: " . $e->getMessage());
                    $failedCustomers[] = [
                        'customer_id' => $customer->cus_id,
                        'customer_name' => $customer->cus_name,
                        'error' => $e->getMessage()
                    ];
                }
            }
            
            return [
                'success_count' => $successCount,
                'failed' => $failedCustomers
            ];
        });
    }

    // =========================================================================
    // Duplicate Check
    // =========================================================================

    /**
     * Check for duplicate customers
     * 
     * @param string $type 'phone' or 'company'
     * @param string $value Value to check
     * @return array
     */
    public function checkDuplicate(string $type, string $value): array
    {
        $duplicates = $this->customerRepository->checkDuplicate($type, $value);
        
        if ($duplicates->isEmpty()) {
            return [
                'found' => false,
                'data' => []
            ];
        }

        $formattedData = $duplicates->map(function ($customer) {
            return [
                'cus_id' => $customer->cus_id,
                'cus_name' => $customer->cus_name,
                'cus_company' => $customer->cus_company,
                'cus_tel_1' => $customer->cus_tel_1,
                'sales_name' => $customer->cusManageBy?->username ?? 'ไม่มีผู้ดูแล',
                'sales_fullname' => $customer->cusManageBy 
                    ? trim(($customer->cusManageBy->user_firstname ?? '') . ' ' . ($customer->cusManageBy->user_lastname ?? ''))
                    : 'ไม่มีผู้ดูแล',
                'created_date' => $customer->cus_created_date
            ];
        });

        return [
            'found' => true,
            'data' => $formattedData
        ];
    }

    // =========================================================================
    // Helper Methods - Customer Number & Recall
    // =========================================================================

    /**
     * Generate customer number
     * Format: YYYY + 6-digit sequence (e.g., 2024000001)
     * 
     * @param string|null $lastNo Last customer number
     * @return string
     */
    public function genCustomerNo(?string $lastNo = null): string
    {
        $currentYear = Carbon::now()->year;
        $yearStr = (string) $currentYear;

        if ($lastNo) {
            $lastYear = substr($lastNo, 0, 4);
            $lastId = (int) substr($lastNo, 4);
            $nextId = ($lastYear == $yearStr) ? $lastId + 1 : 1;
        } else {
            $nextId = 1;
        }

        return $yearStr . sprintf("%06d", $nextId);
    }

    /**
     * Calculate recall datetime
     * 
     * @param string $defaultRecall Default recall period (e.g., "7 days")
     * @return Carbon
     */
    public function setRecallDatetime(string $defaultRecall): Carbon
    {
        return Carbon::now()->modify('+' . $defaultRecall)->setTime(23, 59, 59);
    }

    // =========================================================================
    // Protected Helper Methods
    // =========================================================================

    /**
     * Clean numeric fields (remove non-numeric characters)
     */
    protected function cleanNumericFields(array $data): array
    {
        foreach ($this->numericFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = preg_replace('/[^0-9]/', '', $data[$field]);
            }
        }
        return $data;
    }

    /**
     * Extract manager ID from various input shapes
     * Supports scalar ("123") or object (["user_id" => 123])
     * 
     * @param mixed $input
     * @return int|null
     */
    protected function extractManagerId($input): ?int
    {
        if (is_array($input)) {
            $candidate = $input['user_id'] ?? $input['id'] ?? null;
        } elseif (is_object($input)) {
            $candidate = $input->user_id ?? $input->id ?? null;
        } else {
            $candidate = $input;
        }

        if ($candidate === null || $candidate === '') {
            return null;
        }

        return is_numeric($candidate) ? (int) $candidate : null;
    }

    /**
     * Get default customer group (Grade D)
     */
    protected function getDefaultCustomerGroup(): CustomerGroup
    {
        // Grade D has sort order 4
        $group = CustomerGroup::where('mcg_is_use', true)
            ->where('mcg_sort', 4)
            ->select('mcg_id', 'mcg_name', 'mcg_recall_default', 'mcg_sort')
            ->first();
        
        // Fallback to lowest grade if D not found
        if (!$group) {
            $group = CustomerGroup::where('mcg_is_use', true)
                ->select('mcg_id', 'mcg_name', 'mcg_recall_default', 'mcg_sort')
                ->orderBy('mcg_sort', 'desc')
                ->first();
        }
        
        return $group;
    }

    /**
     * Create customer detail record
     */
    protected function createCustomerDetail(Customer $customer, array $data, CustomerGroup $group): CustomerDetail
    {
        $detail = new CustomerDetail();
        $detail->fill($data);
        $detail->cd_id = Str::uuid();
        $detail->cd_cus_id = $customer->cus_id;
        $detail->cd_last_datetime = $this->setRecallDatetime($group->mcg_recall_default);
        $detail->cd_created_date = now();
        $detail->cd_created_by = Auth::id();
        $detail->cd_updated_date = now();
        $detail->cd_updated_by = Auth::id();
        $detail->save();
        
        return $detail;
    }

    /**
     * Update customer detail record
     */
    protected function updateCustomerDetail(string $customerId, array $data): ?CustomerDetail
    {
        $detail = CustomerDetail::where('cd_cus_id', $customerId)->first();
        
        if ($detail) {
            $detail->fill($data);
            $detail->cd_updated_date = now();
            $detail->cd_updated_by = Auth::id();
            $detail->save();
        }
        
        return $detail;
    }

    /**
     * Create customer-user relation
     */
    protected function createCustomerRelation(Customer $customer): CustomerUser
    {
        $relation = new CustomerUser();
        $relation->rcs_cus_id = $customer->cus_id;
        $relation->rcs_user_id = $customer->cus_manage_by;
        $relation->save();
        
        return $relation;
    }

    /**
     * Update recall date for customer
     */
    protected function updateRecallDate(string $customerId, string $recallDefault): void
    {
        $detail = CustomerDetail::where('cd_cus_id', $customerId)->first();
        
        if ($detail) {
            $detail->cd_last_datetime = $this->setRecallDatetime($recallDefault);
            $detail->cd_updated_date = now();
            $detail->cd_updated_by = Auth::id();
            $detail->save();
        }
    }

    /**
     * Handle address update - supports both component and full address formats
     */
    protected function handleAddressUpdate(Customer $customer, array $data): void
    {
        try {
            $hasComponents = isset($data['cus_pro_id']) || 
                           isset($data['cus_dis_id']) || 
                           isset($data['cus_sub_id']);
            
            $hasFullAddress = isset($data['cus_address']) && !empty($data['cus_address']);
            $hasAddressDetail = isset($data['cus_address_detail']) && !empty($data['cus_address_detail']);

            if ($hasComponents) {
                // Format 1: Components from dropdown selection
                Log::info('Updating address from components', [
                    'pro_id' => $data['cus_pro_id'] ?? null,
                    'dis_id' => $data['cus_dis_id'] ?? null,
                    'sub_id' => $data['cus_sub_id'] ?? null,
                    'zip_code' => $data['cus_zip_code'] ?? null,
                    'address_detail' => $data['cus_address_detail'] ?? null
                ]);

                $customer->updateAddressFromComponents(
                    $data['cus_address_detail'] ?? null,
                    $data['cus_sub_id'] ?? null,
                    $data['cus_dis_id'] ?? null,
                    $data['cus_pro_id'] ?? null,
                    $data['cus_zip_code'] ?? null
                );

            } elseif ($hasFullAddress) {
                // Format 2: Full address string (GPS or manual input)
                Log::info('Updating address from full address', [
                    'full_address' => $data['cus_address']
                ]);

                $customer->updateAddressFromFull($data['cus_address']);

            } elseif ($hasAddressDetail) {
                // Format 3: Only address detail without location
                Log::info('Updating address detail only', [
                    'address_detail' => $data['cus_address_detail']
                ]);

                $customer->cus_address = $data['cus_address_detail'];
            }

            Log::info('Address updated successfully', [
                'customer_id' => $customer->cus_id,
                'final_address' => $customer->cus_address,
                'pro_id' => $customer->cus_pro_id,
                'dis_id' => $customer->cus_dis_id,
                'sub_id' => $customer->cus_sub_id,
                'zip_code' => $customer->cus_zip_code
            ]);

        } catch (\Exception $e) {
            Log::error('Handle address update error: ' . $e->getMessage(), [
                'customer_id' => $customer->cus_id ?? 'new',
                'input_data' => $data
            ]);
            
            // Fallback: use raw address if provided
            if (isset($data['cus_address'])) {
                $customer->cus_address = $data['cus_address'];
            }
        }
    }

    /**
     * Create initial history record for new customer
     * Uses previous_channel = NULL to indicate creation event
     * 
     * @param Customer $customer
     * @return void
     */
    protected function createInitialHistory(Customer $customer): void
    {
        try {
            CustomerTransferHistory::create([
                'id' => Str::uuid()->toString(),
                'customer_id' => $customer->cus_id,
                'previous_channel' => null, // NULL = creation event
                'new_channel' => $customer->cus_channel,
                'previous_manage_by' => null,
                'new_manage_by' => $customer->cus_manage_by,
                'action_by_user_id' => Auth::id(),
                'remark' => 'สร้างลูกค้าใหม่',
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Log but don't fail customer creation
            Log::warning('Failed to create initial history: ' . $e->getMessage(), [
                'customer_id' => $customer->cus_id
            ]);
        }
    }

    /**
     * Record manager change history
     * 
     * @param string $customerId Customer UUID
     * @param int $channel Current channel
     * @param int|null $oldManageBy Previous manager user ID (null if from pool)
     * @param int|null $newManageBy New manager user ID (null if returning to pool)
     * @param string $remark Reason for change
     * @return void
     */
    protected function recordManagerChangeHistory(
        string $customerId,
        int $channel,
        ?int $oldManageBy,
        ?int $newManageBy,
        string $remark = 'เปลี่ยนผู้ดูแล'
    ): void {
        try {
            CustomerTransferHistory::create([
                'id' => Str::uuid()->toString(),
                'customer_id' => $customerId,
                'previous_channel' => $channel,
                'new_channel' => $channel, // Same channel, just manager change
                'previous_manage_by' => $oldManageBy,
                'new_manage_by' => $newManageBy,
                'action_by_user_id' => Auth::id(),
                'remark' => $remark,
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to record manager change history: ' . $e->getMessage(), [
                'customer_id' => $customerId,
                'old_manage_by' => $oldManageBy,
                'new_manage_by' => $newManageBy
            ]);
        }
    }
}
