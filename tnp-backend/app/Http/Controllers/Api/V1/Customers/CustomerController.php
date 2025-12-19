<?php

namespace App\Http\Controllers\Api\V1\Customers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\CustomerResource;
use App\Http\Requests\V1\StoreCustomerRequest;
use App\Http\Requests\V1\UpdateCustomerRequest;
use App\Http\Requests\V1\RecallCustomerRequest;
use App\Http\Requests\V1\ChangeGradeRequest;
use App\Services\CustomerService;
use App\Services\CustomerTransferService;
use App\Contracts\Repositories\CustomerRepositoryInterface;
use App\Helpers\AccountingHelper;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Customer Controller
 * 
 * Handles HTTP requests for Customer resource.
 * Business logic is delegated to CustomerService.
 * Database queries are delegated to CustomerRepository.
 */
class CustomerController extends Controller
{
    /**
     * Create a new controller instance.
     * Dependencies are injected via Laravel's DI container.
     */
    public function __construct(
        protected CustomerService $customerService,
        protected CustomerRepositoryInterface $customerRepository,
        protected CustomerTransferService $transferService
    ) {}

    // =========================================================================
    // CRUD Operations
    // =========================================================================

    /**
     * Display a listing of customers.
     * GET /api/v1/customers
     */
    public function index(Request $request): JsonResponse|array
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            if (!$user) {
                return response()->json(['message' => 'User is null']);
            }

            $filters = $request->only([
                'group', 'search', 'start_date', 'end_date',
                'sales_names', 'channels', 'min_recall_days',
                'max_recall_days', 'per_page', 'sort_field', 'sort_direction',
                'subordinate_user_ids' // For HEAD to filter by their subordinates
            ]);

            $customers = $this->customerRepository->getFiltered($filters, $user);
            $groups = $this->customerRepository->getCustomerGroups($filters, $user);
            $totalCount = $this->customerRepository->getTotalCount($filters, $user);

            return [
                'data' => CustomerResource::collection($customers),
                'groups' => $groups,
                'total_count' => $totalCount,
                'pagination' => [
                    'current_page' => $customers->currentPage(),
                    'per_page' => $customers->perPage(),
                    'total_pages' => $customers->lastPage(),
                    'total_items' => $customers->total()
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Fetch customer error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Fetch customer error: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Store a newly created customer.
     * POST /api/v1/customers
     */
    public function store(StoreCustomerRequest $request): JsonResponse
    {
        try {
            $customer = $this->customerService->createCustomer($request->validated());

            return response()->json([
                'status' => 'success',
                'message' => AccountingHelper::isTelesales()
                    ? 'สร้างลูกค้าสำเร็จ กำลังรอการจัดสรรงาน'
                    : 'สร้างลูกค้าสำเร็จ',
                'data' => [
                    'customer_id' => $customer->cus_id,
                    'allocation_status' => $customer->cus_allocation_status
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Create customer error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Create customer error: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Display the specified customer.
     * GET /api/v1/customers/{id}
     */
    public function show(string $id): JsonResponse|CustomerResource|\Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        if ($id === 'all') {
            $customers = $this->customerRepository->getAllBasic();
            if ($customers->isEmpty()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer not found'
                ]);
            }
            return CustomerResource::collection($customers);
        }

        $customer = $this->customerRepository->findActiveWithRelations($id);
        if (!$customer) {
            return response()->json([
                'status' => 'error',
                'message' => 'Customer not found'
            ]);
        }

        return new CustomerResource($customer);
    }

    /**
     * Update the specified customer.
     * PUT/PATCH /api/v1/customers/{id}
     */
    public function update(UpdateCustomerRequest $request, string $id): JsonResponse
    {
        try {
            $this->customerService->updateCustomer($id, $request->validated());
            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            Log::error('Update customer error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Update customer error: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Remove the specified customer (soft delete).
     * DELETE /api/v1/customers/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $this->customerService->deleteCustomer($id);
            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            Log::error('Delete customer error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Delete customer error: ' . $e->getMessage()
            ]);
        }
    }

    // =========================================================================
    // Grade & Recall Operations
    // =========================================================================

    /**
     * Recall customer with updated note/status.
     * POST /api/v1/customers/{id}/recall
     */
    public function recall(RecallCustomerRequest $request, string $id): JsonResponse
    {
        try {
            $this->customerService->recallCustomer(
                $id,
                $request->validated(),
                $request->cus_mcg_id
            );
            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            Log::error('Recall customer error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Recall customer error: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Change customer grade (up/down).
     * POST /api/v1/customers/{id}/change-grade
     */
    public function changeGrade(ChangeGradeRequest $request, string $id): JsonResponse
    {
        try {
            $result = $this->customerService->changeGrade($id, $request->direction);
            return response()->json([
                'status' => 'success',
                'data' => $result
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        } catch (\Exception $e) {
            Log::error('Change grade error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Change grade error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customer counts per group with filters.
     * GET /api/v1/customers/group-counts
     */
    public function getGroupCounts(Request $request): JsonResponse
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            if (!$user) {
                return response()->json(['message' => 'User is required'], 400);
            }

            $filters = $request->only([
                'search', 'start_date', 'end_date', 'sales_names',
                'channels', 'min_recall_days', 'max_recall_days'
            ]);

            $counts = $this->customerRepository->getGroupCounts($filters, $user);

            return response()->json([
                'group_counts' => $counts,
                'timestamp' => now()->timestamp
            ]);
        } catch (\Exception $e) {
            Log::error('Fetch group counts error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching group counts: ' . $e->getMessage()
            ], 500);
        }
    }

    // =========================================================================
    // Pool & Allocation Operations
    // =========================================================================

    /**
     * Get customers in pool (waiting for allocation).
     * GET /api/v1/customers/pool
     */
    public function getPoolCustomers(Request $request): JsonResponse
    {
        if (!AccountingHelper::canAllocateCustomers()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Only admin and manager can access pool customers'
            ], 403);
        }

        try {
            $filters = $request->only(['source', 'search', 'per_page']);
            $customers = $this->customerRepository->getPoolCustomers($filters);

            return response()->json([
                'status' => 'success',
                'data' => CustomerResource::collection($customers),
                'pagination' => [
                    'current_page' => $customers->currentPage(),
                    'per_page' => $customers->perPage(),
                    'total_pages' => $customers->lastPage(),
                    'total_items' => $customers->total()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get pool customers error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching pool customers: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pool customers from Telesales source.
     * GET /api/v1/customers/pool/telesales
     */
    public function getPoolTelesalesCustomers(Request $request): JsonResponse
    {
        if (!AccountingHelper::canAllocateCustomers()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            $filters = $request->only(['search', 'per_page']);
            $customers = $this->customerRepository->getPoolTelesalesCustomers($filters);

            return response()->json([
                'status' => 'success',
                'data' => CustomerResource::collection($customers),
                'pagination' => [
                    'current_page' => $customers->currentPage(),
                    'per_page' => $customers->perPage(),
                    'total_pages' => $customers->lastPage(),
                    'total' => $customers->total()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get telesales pool error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pool customers that were transferred.
     * GET /api/v1/customers/pool/transferred
     * 
     * @param int|null channel Filter by new_channel (1=SALES, 2=ONLINE)
     */
    public function getPoolTransferredCustomers(Request $request): JsonResponse
    {
        if (!AccountingHelper::canAllocateCustomers()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            $filters = $request->only(['channel', 'per_page']);
            $customers = $this->customerRepository->getPoolTransferredCustomers($filters);
            
            // Attach latest transfer info via TransferService
            $customers = $this->transferService->attachTransferInfo($customers);

            return response()->json([
                'status' => 'success',
                'data' => CustomerResource::collection($customers),
                'pagination' => [
                    'current_page' => $customers->currentPage(),
                    'per_page' => $customers->perPage(),
                    'total_pages' => $customers->lastPage(),
                    'total' => $customers->total()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get transferred pool error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign customers from pool to a sales person.
     * POST /api/v1/customers/assign
     */
    public function assignCustomers(Request $request): JsonResponse
    {
        if (!AccountingHelper::canAllocateCustomers()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Only admin and manager can allocate customers'
            ], 403);
        }

        $request->validate([
            'customer_ids' => 'required|array',
            'customer_ids.*' => 'required|string|size:36',
            'sales_user_id' => 'required|integer|exists:users,user_id'
        ]);

        try {
            $salesUser = User::where('user_id', $request->sales_user_id)
                ->where('enable', 'Y')
                ->whereIn('role', ['sale', 'admin', 'manager'])
                ->first();

            if (!$salesUser) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid sales user or user is not active'
                ], 400);
            }

            $result = $this->customerService->assignCustomers(
                $request->customer_ids,
                $request->sales_user_id,
                $request->input('force', false)
            );

            $status = empty($result['failed']) ? 'success' : ($result['success_count'] > 0 ? 'partial_success' : 'error');
            $message = empty($result['failed'])
                ? "จัดสรรลูกค้าสำเร็จ {$result['success_count']} รายให้กับ {$salesUser->username}"
                : "จัดสรรลูกค้าสำเร็จ {$result['success_count']} ราย, ล้มเหลว " . count($result['failed']) . " ราย";

            return response()->json([
                'status' => $status,
                'message' => $message,
                'data' => [
                    'allocated_count' => $result['success_count'],
                    'failed_count' => count($result['failed']),
                    'failed_customers' => $result['failed'],
                    'sales_user' => [
                        'user_id' => $salesUser->user_id,
                        'username' => $salesUser->username,
                        'name' => $salesUser->user_firstname . ' ' . $salesUser->user_lastname
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Assign customers error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Error assigning customers: ' . $e->getMessage()
            ], 500);
        }
    }

    // =========================================================================
    // Duplicate Check
    // =========================================================================

    /**
     * Check for duplicate customers.
     * POST /api/v1/customers/check-duplicate
     */
    public function checkDuplicate(Request $request): JsonResponse
    {
        try {
            $type = $request->input('type');
            $value = $request->input('value');

            if (!$type || !$value) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Type and value are required'
                ], 400);
            }

            if (!in_array($type, ['phone', 'company'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid type. Use "phone" or "company"'
                ], 400);
            }

            $result = $this->customerService->checkDuplicate($type, $value);

            return response()->json([
                'status' => 'success',
                'found' => $result['found'],
                'data' => $result['data']
            ]);
        } catch (\Exception $e) {
            Log::error('Check duplicate error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to check duplicate: ' . $e->getMessage()
            ], 500);
        }
    }

    // =========================================================================
    // Transfer Operations
    // =========================================================================

    /**
     * Transfer customer to Sales channel.
     * POST /api/v1/customers/{id}/transfer-to-sales
     */
    public function transferToSales(Request $request, string $id): JsonResponse
    {
        return $this->handleTransfer($request, $id, 'transferToSales', ['admin', 'head_online']);
    }

    /**
     * Transfer customer to Online channel.
     * POST /api/v1/customers/{id}/transfer-to-online
     */
    public function transferToOnline(Request $request, string $id): JsonResponse
    {
        return $this->handleTransfer($request, $id, 'transferToOnline', ['admin', 'head_offline']);
    }

    /**
     * Get customer transfer history.
     * GET /api/v1/customers/{id}/transfer-history
     */
    public function getTransferHistory(string $id): JsonResponse
    {
        try {
            $history = $this->transferService->getHistory($id);
            return response()->json([
                'status' => 'success',
                'data' => $history
            ]);
        } catch (\Exception $e) {
            Log::error('Get transfer history error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'ไม่สามารถดึงประวัติการโอนได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get transfer info for a customer.
     * GET /api/v1/customers/{id}/transfer-info
     */
    public function getTransferInfo(string $id): JsonResponse
    {
        try {
            $customer = $this->customerRepository->findOrFail($id);
            $user = Auth::user();

            $info = $this->transferService->getTransferInfo($user->role, $customer->cus_channel);
            $info['customer_id'] = $id;
            $info['customer_name'] = $customer->cus_name ?? $customer->cus_company;

            return response()->json([
                'status' => 'success',
                'data' => $info
            ]);
        } catch (\Exception $e) {
            Log::error('Get transfer info error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // =========================================================================
    // Address Operations
    // =========================================================================

    /**
     * Parse full address into components.
     * POST /api/v1/customers/parse-address
     */
    public function parseAddress(Request $request): JsonResponse
    {
        try {
            $fullAddress = $request->input('address');

            if (!$fullAddress) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'กรุณาระบุที่อยู่ที่ต้องการแปลง'
                ], 400);
            }

            $addressService = app(\App\Services\AddressService::class);
            $components = $addressService->parseFullAddress($fullAddress);
            $locationIds = $addressService->findLocationIds(
                $components['province'],
                $components['district'],
                $components['subdistrict']
            );

            return response()->json([
                'status' => 'success',
                'data' => [
                    'components' => $components,
                    'location_ids' => $locationIds
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Parse address error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'เกิดข้อผิดพลาดในการแปลงที่อยู่: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Build full address from components.
     * POST /api/v1/customers/build-address
     */
    public function buildAddress(Request $request): JsonResponse
    {
        try {
            $addressService = app(\App\Services\AddressService::class);
            $fullAddress = $addressService->buildFullAddress(
                $request->input('address_detail'),
                $request->input('sub_id'),
                $request->input('dis_id'),
                $request->input('pro_id'),
                $request->input('zip_code')
            );

            return response()->json([
                'status' => 'success',
                'data' => [
                    'full_address' => $fullAddress
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Build address error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'เกิดข้อผิดพลาดในการสร้างที่อยู่: ' . $e->getMessage()
            ], 500);
        }
    }

    // =========================================================================
    // Unused Methods (kept for Laravel resource controller compatibility)
    // =========================================================================

    public function create() {}
    public function edit(string $id) {}

    // =========================================================================
    // Protected Helper Methods
    // =========================================================================

    /**
     * Get authenticated user from request
     */
    protected function getAuthenticatedUser(Request $request): ?User
    {
        if (!$request->user) {
            return null;
        }

        return User::where('enable', 'Y')
            ->where('user_id', $request->user)
            ->select('user_id', 'role')
            ->first();
    }

    /**
     * Generic transfer handler (DRY pattern)
     */
    protected function handleTransfer(Request $request, string $id, string $method, array $allowedRoles): JsonResponse
    {
        $request->validate([
            'new_manage_by' => 'nullable|integer|exists:users,user_id',
            'remark' => 'nullable|string|max:500'
        ]);

        $user = Auth::user();

        if (!in_array($user->role, $allowedRoles)) {
            return response()->json([
                'status' => 'error',
                'message' => 'ไม่มีสิทธิ์ในการโอนลูกค้า'
            ], 403);
        }

        try {
            DB::beginTransaction();

            $result = $this->transferService->$method(
                $id,
                $request->new_manage_by,
                $request->remark
            );

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "โอนไป {$result['new_channel_label']} สำเร็จ",
                'data' => $result
            ]);
        } catch (\InvalidArgumentException $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Transfer error ({$method}): " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'โอนลูกค้าไม่สำเร็จ: ' . $e->getMessage()
            ], 500);
        }
    }
}
