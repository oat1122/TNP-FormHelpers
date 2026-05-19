<?php

namespace App\Repositories;

use App\Helpers\UserSubRoleHelper;
use App\Models\MasterCustomer;
use App\Models\MasterBusinessType;
use App\Models\Notebook;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * @property \App\Models\MasterCustomer $model
 */
class KpiRepository extends BaseRepository implements KpiRepositoryInterface
{
    public function __construct(MasterCustomer $model)
    {
        parent::__construct($model);
    }

    /**
     * Get base KPI dashboard query
     *
     * @param array<string, string> $dateRange
     * @return Builder<\App\Models\MasterCustomer>
     */
    public function getBaseDashboardQuery(array $dateRange, string $sourceFilter, ?int $targetUserId, string $userColumn = 'cus_allocated_by'): Builder
    {
        $query = $this->model->where('cus_is_use', true)
            ->whereBetween('cus_created_date', [$dateRange['start'], $dateRange['end']]);

        // Apply source filter
        if ($sourceFilter !== 'all') {
            $query->where('cus_source', $sourceFilter);
        }

        // Apply user filter
        if ($targetUserId) {
            $query->where($userColumn, $targetUserId);
        }

        return $query;
    }

    /**
     * Get summary statistics
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @return array<string, mixed>
     */
    public function getSummaryStats(Builder $query): array
    {
        $stats = $query->select(
            DB::raw('COUNT(*) as total'),
            DB::raw('SUM(CASE WHEN cus_allocation_status = "pool" THEN 1 ELSE 0 END) as in_pool'),
            DB::raw('SUM(CASE WHEN cus_allocation_status = "allocated" THEN 1 ELSE 0 END) as allocated')
        )->first();

        return [
            'total_customers' => $stats->total ?? 0,
            'in_pool' => $stats->in_pool ?? 0,
            'allocated' => $stats->allocated ?? 0,
        ];
    }

    /**
     * Get statistics grouped by source
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @return array<string, mixed>
     */
    public function getBySourceStats(Builder $query): array
    {
        return collect($query->select('cus_source', DB::raw('COUNT(*) as count'))
            ->groupBy('cus_source')
            ->get()->toArray())
            ->map(fn ($item) => [
                'source' => $item['cus_source'] ?? 'unknown',
                'count' => $item['count'],
            ])
            ->toArray();
    }

    /**
     * Get statistics grouped by business type
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @return array<int, mixed>
     */
    public function getByBusinessTypeStats(Builder $query): array
    {
        return collect($query->leftJoin('master_business_types', 'master_customers.cus_bt_id', '=', 'master_business_types.bt_id')
            ->select('master_business_types.bt_name', DB::raw('COUNT(master_customers.cus_id) as count'))
            ->groupBy('master_business_types.bt_name')
            ->orderByDesc('count')
            ->get()->toArray())
            ->map(fn ($item) => [
                'business_type' => $item['bt_name'] ?? 'ไม่ระบุ',
                'count' => $item['count'],
            ])
            ->toArray();
    }

    /**
     * Get statistics for allocation status
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @return array<int, mixed>
     */
    public function getByAllocationStats(Builder $query): array
    {
        return collect($query->select('cus_allocation_status', DB::raw('COUNT(*) as count'))
            ->groupBy('cus_allocation_status')
            ->get()->toArray())
            ->map(fn ($item) => [
                'status' => $item['cus_allocation_status'] === 'pool' ? 'รอจัดสรร' : 'จัดสรรแล้ว',
                'count' => $item['count'],
            ])
            ->toArray();
    }

    /**
     * Get statistics grouped by user (cus_allocated_by)
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @return array<int, mixed>
     */
    public function getByUserStats(Builder $query): array
    {
        $stats = $query->select('cus_created_by', DB::raw('COUNT(*) as count'))
            ->whereNotNull('cus_created_by')
            ->groupBy('cus_created_by')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        $userIds = $stats->pluck('cus_created_by')->unique();
        $users = User::whereIn('user_id', $userIds)
            ->select('user_id', 'username', 'user_firstname', 'user_lastname', 'user_nickname')
            ->get()
            ->keyBy('user_id');

        return $stats->map(function ($stat) use ($users) {
            $user = $users->get($stat->cus_created_by);
            $fullName = $user
                ? trim($user->user_firstname.' '.$user->user_lastname.
                       ($user->user_nickname ? " ({$user->user_nickname})" : ''))
                : 'Unknown';

            return [
                'user_id' => $stat->cus_created_by,
                'username' => $user->username ?? 'Unknown',
                'full_name' => $fullName,
                'count' => $stat->count,
            ];
        })->toArray();
    }

    /**
     * Get time series data (daily breakdown)
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @param array<string, string> $dateRange
     * @return array<string, mixed>
     */
    public function getTimeSeriesStats(Builder $query, array $dateRange): array
    {
        return collect($query->select(
            DB::raw('DATE(cus_created_date) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->groupBy(DB::raw('DATE(cus_created_date)'))
            ->orderBy('date')
            ->get()->toArray())
            ->map(fn ($item) => [
                'date' => $item['date'],
                'count' => $item['count'],
            ])
            ->toArray();
    }

    /**
     * Get Recall Statistics
     *
     * @param array<string, \Carbon\Carbon> $dateRange
     * @return array<string, int>
     */
    public function getRecallStats(string $sourceFilter, ?int $targetUserId, array $dateRange): array
    {
        // Base query for recall stats - join with details and groups
        $query = $this->model->query()
            ->join('customer_details', 'master_customers.cus_id', '=', 'customer_details.cd_cus_id')
            ->join('master_customer_groups', 'master_customers.cus_mcg_id', '=', 'master_customer_groups.mcg_id')
            ->where('master_customers.cus_is_use', true)
            ->where('customer_details.cd_is_use', true);

        // Apply filters
        if ($sourceFilter !== 'all') {
            $query->where('master_customers.cus_source', $sourceFilter);
        }

        if ($targetUserId) {
            $query->where('master_customers.cus_allocated_by', $targetUserId);
        }

        // Clone query for efficiency
        $q1 = clone $query;
        $q2 = clone $query;
        $q3 = clone $query;

        $startDateStr = $dateRange['start']->format('Y-m-d H:i:s');
        $endDateStr   = $dateRange['end']->format('Y-m-d H:i:s');

        // 1. Waiting for recall (Overdue)
        $waitingCount = $q1->where('customer_details.cd_last_datetime', '<', Carbon::now())
            ->count();

        // 2. In criteria
        $inCriteriaCount = $q2->where('customer_details.cd_last_datetime', '>=', Carbon::now())
            ->count();

        // 3. Recalls made in period
        $recallsMadeCount = $q3->whereBetween('customer_details.cd_updated_date', [$startDateStr, $endDateStr])
            ->count();

        return [
            'total_waiting'       => $waitingCount,
            'total_in_criteria'   => $inCriteriaCount,
            'recalls_made_count'  => $recallsMadeCount,
        ];
    }

    /**
     * Get Recall Statistics By User (Sales)
     *
     * @param array<string, \Carbon\Carbon> $dateRange
     * @return array<int, mixed>
     */
    public function getRecallStatsByUser(string $sourceFilter, array $dateRange): array
    {
        $startDate = $dateRange['start']->format('Y-m-d H:i:s');
        $endDate   = $dateRange['end']->format('Y-m-d H:i:s');

        $query = $this->model->query()
            ->join('customer_details', 'master_customers.cus_id', '=', 'customer_details.cd_cus_id')
            ->join('master_customer_groups', 'master_customers.cus_mcg_id', '=', 'master_customer_groups.mcg_id')
            ->join('users', 'master_customers.cus_manage_by', '=', 'users.user_id')
            ->where('master_customers.cus_is_use', true)
            ->where('customer_details.cd_is_use', true)
            ->select(
                'users.user_id',
                'users.username',
                'users.user_firstname',
                'users.user_lastname',
                'users.user_nickname',
                DB::raw('COUNT(*) as total_customers'),
                DB::raw('SUM(CASE WHEN customer_details.cd_last_datetime < NOW() THEN 1 ELSE 0 END) as waiting_count'),
                DB::raw('SUM(CASE WHEN customer_details.cd_last_datetime >= NOW() THEN 1 ELSE 0 END) as in_criteria_count'),
                DB::raw("SUM(CASE WHEN customer_details.cd_updated_date BETWEEN '$startDate' AND '$endDate' THEN 1 ELSE 0 END) as recalls_made_count")
            )
            ->whereNotNull('master_customers.cus_manage_by')
            ->groupBy(
                'users.user_id',
                'users.username',
                'users.user_firstname',
                'users.user_lastname',
                'users.user_nickname'
            )
            ->havingRaw('total_customers > 0');

        if ($sourceFilter !== 'all') {
            $query->where('master_customers.cus_source', $sourceFilter);
        }

        return collect($query->orderByDesc('recalls_made_count')->get()->toArray())->map(function ($stat) {
            $fullName = trim($stat['user_firstname'].' '.$stat['user_lastname'].
                ($stat['user_nickname'] ? " ({$stat['user_nickname']})" : ''));

            return [
                'user_id'            => $stat['user_id'],
                'username'           => $stat['username'],
                'full_name'          => $fullName,
                'total_customers'    => (int) $stat['total_customers'],
                'waiting_count'      => (int) $stat['waiting_count'],
                'in_criteria_count'  => (int) $stat['in_criteria_count'],
                'recalls_made_count' => (int) $stat['recalls_made_count'],
            ];
        })->toArray();
    }

    /**
     * Get comparison with previous period
     *
     * @param array<string, mixed> $currentStats
     * @param array{start: string, end: string, label: string} $prevDateRange
     * @return array<string, mixed>
     */
    public function getPeriodComparison(array $currentStats, array $prevDateRange, string $sourceFilter, ?int $targetUserId): array
    {
        $prevQuery = clone $this->getBaseDashboardQuery($prevDateRange, $sourceFilter, $targetUserId);
        $prevStats = $this->getSummaryStats($prevQuery);

        $currentCount = $currentStats['total_customers'] ?? 0;
        $prevCount = $prevStats['total_customers'] ?? 0;
        $diff = $currentCount - $prevCount;

        if ($prevCount == 0) {
            $percentChange = $currentCount > 0 ? 100 : 0;
        } else {
            $percentChange = round(($diff / $prevCount) * 100, 1);
        }

        return [
            'previous' => $prevCount,
            'difference' => $diff,
            'percent_change' => $percentChange,
            'trend' => $diff >= 0 ? 'up' : 'down',
            'period_label' => $prevDateRange['label'],
        ];
    }

    /**
     * Get paginated KPI details
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @return \Illuminate\Pagination\LengthAwarePaginator<\App\Models\MasterCustomer>
     */
    public function getPaginatedDetails(Builder $query, string $kpiType, int $perPage): \Illuminate\Pagination\LengthAwarePaginator
    {
        $query->with(['allocatedBy:user_id,username,user_firstname,user_lastname,user_nickname']);

        // Apply KPI specific filter
        if ($kpiType === 'pool') {
            $query->where('cus_allocation_status', 'pool');
        } elseif ($kpiType === 'allocated') {
            $query->where('cus_allocation_status', 'allocated');
        }
        // 'total' needs no further filtering

        return $query->orderBy('cus_created_date', 'desc')->paginate($perPage);
    }

    /**
     * Get detailed list of customers for a specific Recall status type
     *
     * @param array<string, \Carbon\Carbon> $dateRange
     * @return \Illuminate\Pagination\LengthAwarePaginator<\App\Models\MasterCustomer>
     */
    public function getPaginatedRecallDetails(string $type, string $sourceFilter, ?int $targetUserId, array $dateRange, int $perPage): \Illuminate\Pagination\LengthAwarePaginator
    {
        $startDateStr = $dateRange['start']->format('Y-m-d H:i:s');
        $endDateStr   = $dateRange['end']->format('Y-m-d H:i:s');

        $query = $this->model->query()
            ->join('customer_details', 'master_customers.cus_id', '=', 'customer_details.cd_cus_id')
            ->leftJoin('master_customer_groups', 'master_customers.cus_mcg_id', '=', 'master_customer_groups.mcg_id')
            ->leftJoin('users', 'master_customers.cus_manage_by', '=', 'users.user_id')
            ->where('master_customers.cus_is_use', true)
            ->where('customer_details.cd_is_use', true);

        // Apply Source Filter
        if ($sourceFilter !== 'all') {
            $query->where('master_customers.cus_source', $sourceFilter);
        }

        // Apply User Filter
        if ($targetUserId) {
            $query->where('master_customers.cus_manage_by', $targetUserId);
        }

        switch ($type) {
            case 'waiting':
                $query->where('customer_details.cd_last_datetime', '<', Carbon::now());
                $query->orderBy('customer_details.cd_last_datetime', 'asc');
                break;
            case 'in_criteria':
                $query->where('customer_details.cd_last_datetime', '>=', Carbon::now());
                $query->orderBy('customer_details.cd_last_datetime', 'asc');
                break;
            case 'made':
                $query->whereBetween('customer_details.cd_updated_date', [$startDateStr, $endDateStr]);
                $query->orderBy('customer_details.cd_updated_date', 'desc');
                break;
        }

        // Select Fields
        $query->select([
            'master_customers.cus_id',
            'master_customers.cus_name',
            'master_customers.cus_firstname',
            'master_customers.cus_lastname',
            'master_customers.cus_source',
            'master_customers.cus_allocation_status',
            'customer_details.cd_note as status_note',
            'customer_details.cd_last_datetime',
            'customer_details.cd_updated_date',
            'master_customer_groups.mcg_name as group_name',
            'users.user_firstname as m_fname',
            'users.user_lastname as m_lname',
            'users.username as m_username',
        ]);

        /** @var \Illuminate\Pagination\LengthAwarePaginator<\App\Models\MasterCustomer> $paginator */
        $paginator = $query->paginate($perPage);

        return $paginator;
    }

    /**
     * Export KPI data to collection
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\MasterCustomer>
     */
    public function getExportData(Builder $query): \Illuminate\Database\Eloquent\Collection
    {
        return $query->with(['allocatedBy:user_id,username,user_firstname,user_lastname,user_nickname'])
            ->orderBy('cus_created_date', 'desc')
            ->get();
    }

    public function getNotebookLeadBaseQuery(array $dateRange, string $sourceFilter, ?int $targetUserId): Builder
    {
        $query = Notebook::query()
            ->where('notebooks.nb_workflow', Notebook::WORKFLOW_LEAD_QUEUE)
            ->whereBetween('notebooks.created_at', [$dateRange['start'], $dateRange['end']])
            ->select('notebooks.*')
            ->distinct();

        $this->applyNotebookLeadSourceFilter($query, $sourceFilter);

        if ($targetUserId) {
            $query->where('notebooks.created_by', $targetUserId);
        }

        return $query;
    }

    public function getNotebookLeadSummaryStats(Builder $query): array
    {
        $items = (clone $query)->get(['notebooks.id', 'notebooks.nb_manage_by', 'notebooks.nb_converted_at']);

        $inQueueCount = $items
            ->filter(fn ($item) => empty($item->nb_manage_by) && empty($item->nb_converted_at))
            ->count();

        return [
            'total_customers' => $items->count(),
            'in_pool' => $inQueueCount,
            'allocated' => $items->count() - $inQueueCount,
        ];
    }

    public function getNotebookLeadBySourceStats(Builder $query): array
    {
        return (clone $query)
            ->with(['createdBy.subRoles'])
            ->get()
            ->groupBy(fn (Notebook $notebook) => $this->resolveNotebookLeadSource($notebook))
            ->map(fn ($items, $source) => [
                'source' => $source,
                'count' => $items->count(),
            ])
            ->values()
            ->toArray();
    }

    public function getNotebookLeadByBusinessTypeStats(Builder $query): array
    {
        $items = (clone $query)->get(['notebooks.id', 'notebooks.nb_lead_payload']);
        $businessTypeIds = $items
            ->map(fn (Notebook $notebook) => data_get($notebook->nb_lead_payload, 'cus_bt_id'))
            ->filter()
            ->unique()
            ->values();

        if ($businessTypeIds->isEmpty()) {
            return [];
        }

        $businessTypeNames = MasterBusinessType::query()
            ->whereIn('bt_id', $businessTypeIds)
            ->pluck('bt_name', 'bt_id');

        return $items
            ->map(fn (Notebook $notebook) => data_get($notebook->nb_lead_payload, 'cus_bt_id'))
            ->filter()
            ->countBy()
            ->map(fn ($count, $businessTypeId) => [
                'business_type' => $businessTypeNames->get($businessTypeId, 'Unknown'),
                'count' => $count,
            ])
            ->values()
            ->toArray();
    }

    public function getNotebookLeadByAllocationStats(Builder $query): array
    {
        $items = (clone $query)->get(['notebooks.id', 'notebooks.nb_manage_by', 'notebooks.nb_converted_at']);

        $inQueueCount = $items
            ->filter(fn ($item) => empty($item->nb_manage_by) && empty($item->nb_converted_at))
            ->count();

        return [
            [
                'status' => 'Central Queue',
                'count' => $inQueueCount,
            ],
            [
                'status' => 'Claimed / Converted',
                'count' => $items->count() - $inQueueCount,
            ],
        ];
    }

    public function getNotebookLeadTimeSeriesStats(Builder $query, array $dateRange): array
    {
        return (clone $query)
            ->get(['notebooks.id', 'notebooks.created_at'])
            ->groupBy(fn (Notebook $notebook) => Carbon::parse($notebook->created_at)->format('Y-m-d'))
            ->map(fn ($items, $date) => [
                'date' => $date,
                'count' => $items->count(),
            ])
            ->sortBy('date')
            ->values()
            ->toArray();
    }

    public function getNotebookLeadPeriodComparison(array $currentStats, array $prevDateRange, string $sourceFilter, ?int $targetUserId): array
    {
        $prevQuery = $this->getNotebookLeadBaseQuery($prevDateRange, $sourceFilter, $targetUserId);
        $prevStats = $this->getNotebookLeadSummaryStats($prevQuery);

        $currentCount = $currentStats['total_customers'] ?? 0;
        $prevCount = $prevStats['total_customers'] ?? 0;
        $diff = $currentCount - $prevCount;

        if ($prevCount == 0) {
            $percentChange = $currentCount > 0 ? 100 : 0;
        } else {
            $percentChange = round(($diff / $prevCount) * 100, 1);
        }

        return [
            'previous' => $prevCount,
            'difference' => $diff,
            'percent_change' => $percentChange,
            'trend' => $diff >= 0 ? 'up' : 'down',
            'period_label' => $prevDateRange['label'],
        ];
    }

    public function getNotebookLeadPaginatedDetails(Builder $query, string $kpiType, int $perPage): \Illuminate\Pagination\LengthAwarePaginator
    {
        $query->with([
            'createdBy:user_id,username,user_firstname,user_lastname,user_nickname',
            'manageBy:user_id,username,user_firstname,user_lastname,user_nickname',
        ]);

        if ($kpiType === 'pool') {
            $query->whereNull('notebooks.nb_manage_by')
                ->whereNull('notebooks.nb_converted_at');
        } elseif ($kpiType === 'allocated') {
            $query->where(function (Builder $allocationQuery) {
                $allocationQuery->whereNotNull('notebooks.nb_manage_by')
                    ->orWhereNotNull('notebooks.nb_converted_at');
            });
        }

        return $query->orderByDesc('notebooks.created_at')->paginate($perPage);
    }

    public function getNotebookLeadExportData(Builder $query): \Illuminate\Database\Eloquent\Collection
    {
        return $query->with([
            'createdBy:user_id,username,user_firstname,user_lastname,user_nickname',
            'manageBy:user_id,username,user_firstname,user_lastname,user_nickname',
        ])
            ->orderByDesc('notebooks.created_at')
            ->get();
    }

    protected function applyNotebookLeadSourceFilter(Builder $query, string $sourceFilter): void
    {
        if ($sourceFilter === 'all') {
            return;
        }

        if ($sourceFilter === 'online') {
            $query->where('notebooks.nb_is_online', true);

            return;
        }

        $query
            ->leftJoin('users as notebook_lead_created_users', 'notebooks.created_by', '=', 'notebook_lead_created_users.user_id')
            ->leftJoin('user_sub_roles as notebook_lead_user_sub_roles', 'notebook_lead_created_users.user_id', '=', 'notebook_lead_user_sub_roles.usr_user_id')
            ->leftJoin('master_sub_roles as notebook_lead_master_sub_roles', 'notebook_lead_user_sub_roles.usr_sub_role_id', '=', 'notebook_lead_master_sub_roles.msr_id')
            ->where('notebooks.nb_is_online', false)
            ->where(function (Builder $sourceQuery) use ($sourceFilter) {
                if ($sourceFilter === 'sales') {
                    $sourceQuery->where('notebook_lead_created_users.role', 'sale')
                        ->orWhere('notebook_lead_master_sub_roles.msr_code', UserSubRoleHelper::SUPPORT_SALES);

                    return;
                }

                if ($sourceFilter === 'telesales') {
                    $sourceQuery->where('notebook_lead_created_users.role', 'telesale')
                        ->orWhere('notebook_lead_master_sub_roles.msr_code', UserSubRoleHelper::TALESALES);

                    return;
                }

                $sourceQuery->where('notebook_lead_created_users.role', 'office');
            });
    }

    protected function resolveNotebookLeadSource(Notebook $notebook): string
    {
        if ($notebook->nb_is_online) {
            return 'online';
        }

        $createdBy = $notebook->createdBy;
        $subRoleCodes = UserSubRoleHelper::getSubRoleCodes($createdBy);

        if (($createdBy?->role === 'sale') || in_array(UserSubRoleHelper::SUPPORT_SALES, $subRoleCodes, true)) {
            return 'sales';
        }

        if (($createdBy?->role === 'telesale') || in_array(UserSubRoleHelper::TALESALES, $subRoleCodes, true)) {
            return 'telesales';
        }

        if ($createdBy?->role === 'office') {
            return 'office';
        }

        return 'unknown';
    }
}
