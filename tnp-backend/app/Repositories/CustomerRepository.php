<?php

namespace App\Repositories;

use App\Contracts\Repositories\CustomerRepositoryInterface;
use App\Constants\CustomerChannel;
use App\Models\MasterCustomer as Customer;
use App\Models\MasterCustomerGroup as CustomerGroup;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

/**
 * Customer Repository Implementation
 * 
 * จัดการ database queries ทั้งหมดสำหรับ Customer
 * Controller ไม่ควรมี query logic โดยตรง ให้เรียกผ่าน Repository นี้
 */
class CustomerRepository extends BaseRepository implements CustomerRepositoryInterface
{
    /**
     * Columns to select for customer list
     */
    protected array $listColumns = [
        'cus_id',
        'cus_mcg_id',
        'cus_no',
        'cus_channel',
        'cus_bt_id',
        'cus_company',
        'cus_firstname',
        'cus_lastname',
        'cus_name',
        'cus_tel_1',
        'cus_tel_2',
        'cus_email',
        'cus_tax_id',
        'cus_pro_id',
        'cus_dis_id',
        'cus_sub_id',
        'cus_zip_code',
        'cus_address',
        'cus_manage_by',
        'cus_created_by',
        'cus_created_date',
        'cus_updated_by',
        'cus_updated_date',
        'cus_is_use'
    ];

    /**
     * Create a new repository instance
     */
    public function __construct(Customer $model)
    {
        parent::__construct($model);
    }

    /**
     * {@inheritDoc}
     */
    public function getFiltered(array $filters, User $user): LengthAwarePaginator
    {
        $query = $this->buildFilteredQuery($filters, $user);
        
        $this->applySelect($query);
        $this->applySorting($query, $filters);
        
        $perPage = $filters['per_page'] ?? 10;
        
        return $query->paginate($perPage);
    }

    /**
     * {@inheritDoc}
     */
    public function getGroupCounts(array $filters, User $user): array
    {
        $groups = CustomerGroup::active()
            ->pluck('mcg_id')
            ->toArray();
        
        $counts = [];

        foreach ($groups as $groupId) {
            $query = $this->buildBaseFilteredQuery($filters, $user);
            $query->where('cus_mcg_id', $groupId);
            $counts[$groupId] = $query->count();
        }

        return $counts;
    }

    /**
     * {@inheritDoc}
     */
    public function getCustomerGroups(array $filters, User $user): Collection
    {
        return CustomerGroup::active()
            ->select('mcg_id', 'mcg_name', 'mcg_remark', 'mcg_recall_default', 'mcg_sort')
            ->orderBy('mcg_sort', 'asc')
            ->withCount(['customerGroup' => function ($query) use ($user, $filters) {
                $query->where('cus_is_use', true);

                // Get user's sub_role
                $user->loadMissing('subRoles');
                $subRoleCode = $user->subRoles->first()?->msr_code;
                $isHead = in_array($subRoleCode, ['HEAD_ONLINE', 'HEAD_OFFLINE']);
                $hasSubordinateFilter = !empty($filters['subordinate_user_ids']);

                // Apply role filter
                if ($user->role === 'admin') {
                    // Admin sees all
                } elseif ($isHead && $hasSubordinateFilter) {
                    // HEAD with subordinate filter - see ALL channels
                    $userIds = is_array($filters['subordinate_user_ids'])
                        ? $filters['subordinate_user_ids']
                        : array_map('trim', explode(',', $filters['subordinate_user_ids']));
                    $userIds = array_filter(array_map('intval', $userIds));
                    if (!empty($userIds)) {
                        $query->whereIn('cus_manage_by', $userIds);
                    }
                    // No channel filter - HEAD sees all channels of their subordinates
                } elseif ($isHead) {
                    // HEAD without subordinate filter - show only HEAD's OWN assigned customers (ALL channels)
                    $query->where('cus_manage_by', $user->user_id);
                    // No channel filter - show all channels
                } else {
                    // Regular users see only their assigned customers
                    $query->where('cus_manage_by', $user->user_id);
                }

                // Apply search filter
                if (!empty($filters['search'])) {
                    $this->applySearchFilterToQuery($query, $filters['search']);
                }
            }])
            ->get();
    }

    /**
     * {@inheritDoc}
     */
    public function getTotalCount(array $filters, User $user): int
    {
        return $this->buildBaseFilteredQuery($filters, $user)->count();
    }

    /**
     * {@inheritDoc}
     */
    public function findActiveWithRelations(string $id)
    {
        return $this->model
            ->active()
            ->with([
                'customerDetail',
                'customerProvice',
                'customerDistrict',
                'customerSubdistrict',
                'cusManageBy'
            ])
            ->find($id);
    }

    /**
     * {@inheritDoc}
     */
    public function getAllBasic(): Collection
    {
        return $this->model
            ->select([
                'cus_id',
                'cus_no',
                'cus_channel',
                'cus_company',
                'cus_firstname',
                'cus_lastname',
                'cus_tel_1',
                'cus_tel_2',
                'cus_email',
                'cus_tax_id',
                'cus_pro_id',
                'cus_dis_id',
                'cus_sub_id',
                'cus_zip_code',
                'cus_address',
                'cus_manage_by',
                'cus_created_by',
                'cus_created_date',
                'cus_updated_date',
                'cus_is_use',
            ])
            ->orderBy('cus_no', 'desc')
            ->get();
    }

    /**
     * {@inheritDoc}
     */
    public function getPoolCustomers(array $filters): LengthAwarePaginator
    {
        $query = $this->model
            ->inPool()
            ->with(['customerDetail', 'customerProvice', 'customerDistrict', 'customerSubdistrict'])
            ->select([
                'cus_id',
                'cus_no',
                'cus_source',
                'cus_channel',
                'cus_bt_id',
                'cus_company',
                'cus_firstname',
                'cus_lastname',
                'cus_name',
                'cus_tel_1',
                'cus_tel_2',
                'cus_email',
                'cus_tax_id',
                'cus_pro_id',
                'cus_dis_id',
                'cus_sub_id',
                'cus_zip_code',
                'cus_address',
                'cus_allocation_status',
                'cus_created_by',
                'cus_created_date',
            ])
            ->orderBy('cus_created_date', 'desc');

        // Filter by source
        if (!empty($filters['source'])) {
            $query->where('cus_source', $filters['source']);
        }

        // Apply search
        if (!empty($filters['search'])) {
            $this->applySearchFilterToQuery($query, $filters['search']);
        }

        $perPage = $filters['per_page'] ?? 20;

        return $query->paginate($perPage);
    }

    /**
     * {@inheritDoc}
     */
    public function getLatestCustomerNo(): ?string
    {
        $customer = $this->model
            ->select('cus_no')
            ->orderByDesc('cus_no')
            ->first();

        return $customer?->cus_no;
    }

    /**
     * {@inheritDoc}
     */
    public function checkDuplicate(string $type, string $value): Collection
    {
        $query = $this->model
            ->with(['cusManageBy:user_id,username,user_firstname,user_lastname']);

        if ($type === 'phone') {
            $cleanPhone = preg_replace('/[^0-9]/', '', $value);
            $query->where('cus_tel_1', $cleanPhone);
        } elseif ($type === 'company') {
            $query->where('cus_company', 'like', '%' . $value . '%');
        }

        return $query
            ->select([
                'cus_id',
                'cus_name',
                'cus_company',
                'cus_tel_1',
                'cus_manage_by',
                'cus_created_date'
            ])
            ->limit(5)
            ->get();
    }

    // ========================================================================
    // Public Query Builder Methods
    // ========================================================================

    /**
     * Get base query builder for custom queries in controller
     * 
     * @return Builder
     */
    public function getBaseQuery(): Builder
    {
        return $this->model->active()
            ->with(['customerDetail', 'customerProvice', 'customerDistrict', 'customerSubdistrict']);
    }

    /**
     * Get pool customers from Telesales source
     * 
     * Only shows telesales customers that have NOT been transferred yet.
     * Once a telesales customer is transferred, they should appear in the transferred tab instead.
     * 
     * @param array $filters Filter parameters (search, per_page)
     * @return LengthAwarePaginator
     */
    public function getPoolTelesalesCustomers(array $filters): LengthAwarePaginator
    {
        // Get customer IDs that have been transferred (actual transfer, not initial creation)
        $transferredCustomerIds = \App\Models\CustomerTransferHistory::query()
            ->whereNotNull('previous_channel') // Only actual transfers, not creation events
            ->distinct()
            ->pluck('customer_id');

        $query = $this->model->active()
            ->with(['allocatedBy', 'customerDetail'])
            ->where('cus_allocation_status', 'pool')
            ->where('cus_source', 'telesales')
            ->whereNull('cus_manage_by')
            ->whereNotIn('cus_id', $transferredCustomerIds); // Exclude transferred customers

        if (!empty($filters['search'])) {
            $this->applySearchFilterToQuery($query, $filters['search']);
        }

        $perPage = $filters['per_page'] ?? 30;

        return $query->orderByDesc('cus_created_date')->paginate($perPage);
    }

    /**
     * Get pool customers that have actual transfer history
     * 
     * Shows ALL customers that have been transferred (where previous_channel is NOT NULL),
     * including telesales customers that were transferred.
     * 
     * @param array $filters Filter parameters (channel, per_page)
     * @return LengthAwarePaginator
     */
    public function getPoolTransferredCustomers(array $filters): LengthAwarePaginator
    {
        $channel = $filters['channel'] ?? null;

        // Get customer IDs that have ACTUAL transfer history (not initial creation)
        // Exclude records where previous_channel is NULL (those are just creation events)
        $transferredCustomerIds = \App\Models\CustomerTransferHistory::query()
            ->whereNotNull('previous_channel') // Exclude initial creation history
            ->when($channel, function ($q) use ($channel) {
                $q->where('new_channel', $channel);
            })
            ->distinct()
            ->pluck('customer_id');

        $query = $this->model->active()
            ->where('cus_allocation_status', 'pool')
            ->whereNull('cus_manage_by')
            ->whereIn('cus_id', $transferredCustomerIds);

        $perPage = $filters['per_page'] ?? 30;

        return $query->orderByDesc('cus_created_date')->paginate($perPage);
    }

    // ========================================================================
    // Protected Helper Methods
    // ========================================================================

    /**
     * Build query with common filters applied (includes relations)
     */
    protected function buildFilteredQuery(array $filters, User $user): Builder
    {
        $query = $this->model
            ->active()
            ->with(['customerDetail', 'customerProvice', 'customerDistrict', 'customerSubdistrict']);

        return $this->applyAllFilters($query, $filters, $user);
    }

    /**
     * Build base filtered query (without relations, for counting)
     */
    protected function buildBaseFilteredQuery(array $filters, User $user): Builder
    {
        $query = $this->model->active();
        
        return $this->applyAllFilters($query, $filters, $user);
    }

    /**
     * Apply all filters to query
     */
    protected function applyAllFilters(Builder $query, array $filters, User $user): Builder
    {
        // Group filter
        if (!empty($filters['group']) && $filters['group'] !== 'all') {
            $query->where('cus_mcg_id', $filters['group']);
        }

        // Role-based visibility
        $this->applyRoleFilter($query, $user, $filters);

        // Search filter
        if (!empty($filters['search'])) {
            $this->applySearchFilterToQuery($query, $filters['search']);
        }

        // Date range filter
        if (!empty($filters['start_date']) || !empty($filters['end_date'])) {
            $query->filterByDateRange(
                $filters['start_date'] ?? null,
                $filters['end_date'] ?? null
            );
        }

        // Sales names filter
        if (!empty($filters['sales_names'])) {
            $salesNames = is_array($filters['sales_names'])
                ? $filters['sales_names']
                : explode(',', $filters['sales_names']);
            $query->filterBySalesNames($salesNames);
        }

        // Channel filter
        if (!empty($filters['channels'])) {
            $channels = is_array($filters['channels'])
                ? $filters['channels']
                : explode(',', $filters['channels']);
            $query->filterByChannels($channels);
        }

        // Recall range filter
        if (isset($filters['min_recall_days']) || isset($filters['max_recall_days'])) {
            $query->filterByRecallRange(
                isset($filters['min_recall_days']) ? (int) $filters['min_recall_days'] : null,
                isset($filters['max_recall_days']) ? (int) $filters['max_recall_days'] : null
            );
        }

        // Subordinate user IDs filter (for HEAD to see only their subordinates' customers)
        if (!empty($filters['subordinate_user_ids'])) {
            $userIds = is_array($filters['subordinate_user_ids'])
                ? $filters['subordinate_user_ids']
                : array_map('trim', explode(',', $filters['subordinate_user_ids']));
            
            // Convert to integers and filter out empty values
            $userIds = array_filter(array_map('intval', $userIds));
            
            if (!empty($userIds)) {
                $query->whereIn('cus_manage_by', $userIds);
            }
        }

        return $query;
    }

    /**
     * Apply role-based filtering
     * 
     * If subordinate_user_ids are provided in filters, skip individual user filter
     * as HEADs should see their subordinates' customers instead.
     */
    protected function applyRoleFilter(Builder $query, User $user, array $filters = []): void
    {
        // If subordinate_user_ids filter is provided, the HEAD is viewing subordinates' customers
        // Skip the individual user filter in this case
        $hasSubordinateFilter = !empty($filters['subordinate_user_ids']);
        
        // Get user's sub_role code
        $user->load('subRoles');
        $subRoleCode = $user->subRoles->first()?->msr_code;
        
        // Check if user is HEAD based on sub_role
        $isHeadOnline = $subRoleCode === 'HEAD_ONLINE';
        $isHeadOffline = $subRoleCode === 'HEAD_OFFLINE';
        $isHead = $isHeadOnline || $isHeadOffline;
        
        // Admin sees everything
        if ($user->role === 'admin') {
            return;
        }
        
        // HEAD with subordinate filter - see ALL subordinates' customers (all channels)
        if ($isHead && $hasSubordinateFilter) {
            // No channel filter - HEAD sees all channels of their subordinates
            return;
        }
        
        // HEAD without subordinate filter - show only HEAD's OWN assigned customers (ALL channels)
        if ($isHead) {
            // Filter by HEAD's own user_id - no channel filter, show all channels
            $query->where('cus_manage_by', $user->user_id);
            return;
        }
        
        // Regular users see only their assigned customers
        $query->where('cus_manage_by', $user->user_id);
    }

    /**
     * Apply search filter to query
     */
    protected function applySearchFilterToQuery(Builder $query, string $search): void
    {
        $searchTerm = '%' . trim($search) . '%';
        
        $query->where(function ($q) use ($searchTerm) {
            $q->where('cus_name', 'like', $searchTerm)
              ->orWhere('cus_company', 'like', $searchTerm)
              ->orWhere('cus_no', 'like', $searchTerm)
              ->orWhere('cus_tel_1', 'like', $searchTerm)
              ->orWhereHas('cusManageBy', function ($userQuery) use ($searchTerm) {
                  $userQuery->where('username', 'like', $searchTerm);
              });
        });
    }

    /**
     * Apply select columns to query
     */
    protected function applySelect(Builder $query): void
    {
        $query->select($this->listColumns);
    }

    /**
     * Apply sorting to query
     */
    protected function applySorting(Builder $query, array $filters): void
    {
        if (empty($filters['sort_field']) || empty($filters['sort_direction'])) {
            // Default ordering
            $query->orderBy('master_customers.cus_no', 'desc');
            return;
        }

        $sortField = $filters['sort_field'];
        $sortDirection = $filters['sort_direction'] === 'desc' ? 'desc' : 'asc';

        // Check existing joins to avoid duplicates
        $joins = collect($query->getQuery()->joins)->pluck('table')->toArray();

        switch ($sortField) {
            case 'cus_manage_by':
                // Sales name sorting - join with users table
                if (!in_array('users', $joins)) {
                    $query->leftJoin('users', 'master_customers.cus_manage_by', '=', 'users.user_id');
                }
                $query->orderBy('users.username', $sortDirection);
                break;

            case 'cd_last_datetime':
                // Recall date sorting - join with customer_details
                if (!in_array('customer_details', $joins)) {
                    $query->leftJoin('customer_details', 'master_customers.cus_id', '=', 'customer_details.cd_cus_id');
                }
                $query->orderBy('customer_details.cd_last_datetime', $sortDirection);
                break;

            case 'cd_note':
                // Note field sorting
                if (!in_array('customer_details', $joins)) {
                    $query->leftJoin('customer_details', 'master_customers.cus_id', '=', 'customer_details.cd_cus_id');
                }
                $query->orderBy('customer_details.cd_note', $sortDirection);
                break;

            default:
                // Regular field sorting with table prefix
                $query->orderBy("master_customers.{$sortField}", $sortDirection);
                break;
        }
    }
}
