<?php

namespace App\Services;

use App\Helpers\AccountingHelper;
use App\Repositories\KpiRepositoryInterface;
use Carbon\Carbon;

class KpiService
{
    public function __construct(
        protected KpiRepositoryInterface $kpiRepository
    ) {}

    /**
     * Get date range based on period type
     * 
     * @return array{start: Carbon, end: Carbon, label: string}
     */
    public function getDateRange(string $period, ?string $startDate, ?string $endDate): array
    {
        // If start_date and end_date are explicitly provided, always use them
        if ($startDate && $endDate) {
            $start = Carbon::parse($startDate)->startOfDay();
            $end = Carbon::parse($endDate)->endOfDay();

            return [
                'start' => $start,
                'end' => $end,
                'label' => $start->format('d/m/Y').' - '.$end->format('d/m/Y'),
            ];
        }

        $now = Carbon::now();

        switch ($period) {
            case 'today':
                return [
                    'start' => $now->copy()->startOfDay(),
                    'end' => $now->copy()->endOfDay(),
                    'label' => 'วันนี้',
                ];
            case 'week':
                return [
                    'start' => $now->copy()->startOfWeek(),
                    'end' => $now->copy()->endOfWeek(),
                    'label' => 'สัปดาห์นี้',
                ];
            case 'month':
                return [
                    'start' => $now->copy()->startOfMonth(),
                    'end' => $now->copy()->endOfMonth(),
                    'label' => 'เดือนนี้',
                ];
            case 'quarter':
                return [
                    'start' => $now->copy()->startOfQuarter(),
                    'end' => $now->copy()->endOfQuarter(),
                    'label' => 'ไตรมาสนี้ (Q'.$now->quarter.')',
                ];
            case 'year':
                return [
                    'start' => $now->copy()->startOfYear(),
                    'end' => $now->copy()->endOfYear(),
                    'label' => 'ปีนี้ ('.$now->year.')',
                ];
            case 'custom':
                $start = Carbon::parse($startDate)->startOfDay();
                $end = Carbon::parse($endDate)->endOfDay();

                return [
                    'start' => $start,
                    'end' => $end,
                    'label' => $start->format('d/m/Y').' - '.$end->format('d/m/Y'),
                ];

                // Previous periods
            case 'prev_month':
                return [
                    'start' => $now->copy()->subMonth()->startOfMonth(),
                    'end' => $now->copy()->subMonth()->endOfMonth(),
                    'label' => 'เดือนที่แล้ว',
                ];
            case 'prev_week':
                return [
                    'start' => $now->copy()->subWeek()->startOfWeek(),
                    'end' => $now->copy()->subWeek()->endOfWeek(),
                    'label' => 'สัปดาห์ที่แล้ว',
                ];
            case 'prev_quarter':
                return [
                    'start' => $now->copy()->subQuarter()->startOfQuarter(),
                    'end' => $now->copy()->subQuarter()->endOfQuarter(),
                    'label' => 'ไตรมาสที่แล้ว (Q'.$now->copy()->subQuarter()->quarter.')',
                ];

            default:
                return [
                    'start' => $now->copy()->startOfMonth(),
                    'end' => $now->copy()->endOfMonth(),
                    'label' => 'เดือนนี้',
                ];
        }
    }

    /**
     * Get Thai label for source
     */
    public function getSourceLabel(?string $source): string
    {
        return match ($source) {
            'telesales' => 'Telesales',
            'sales' => 'Sales',
            'online' => 'Online',
            'office' => 'Office',
            default => $source ?? 'ไม่ระบุ',
        };
    }

    /**
     * Determine user target id based on role and request
     * 
     * @param \App\Models\User $user
     */
    public function getTargetUserId(?int $requestedUserId, $user): ?int
    {
        $isAdmin = AccountingHelper::hasRole(['admin', 'manager']);
        if ($requestedUserId && $isAdmin) {
            return $requestedUserId;
        } elseif (! $isAdmin) {
            return $user->user_id;
        }

        return null;
    }

    /**
     * Get dashboard data
     * 
     * @param \App\Models\User $user
     * @return array<string, mixed>
     */
    public function getDashboardData(string $period, ?string $startDate, ?string $endDate, string $sourceFilter, ?int $requestedUserId, $user): array
    {
        $isAdmin = AccountingHelper::hasRole(['admin', 'manager']);
        $dateRange = $this->getDateRange($period, $startDate, $endDate);
        $targetUserId = $this->getTargetUserId($requestedUserId, $user);

        // Fetch query
        $baseQuery = $this->kpiRepository->getBaseDashboardQuery($dateRange, $sourceFilter, $targetUserId);

        $summary = $this->kpiRepository->getSummaryStats(clone $baseQuery);
        $bySource = $this->kpiRepository->getBySourceStats(clone $baseQuery);
        $byUser = $isAdmin ? $this->kpiRepository->getByUserStats(clone $baseQuery) : [];
        $timeSeries = $this->kpiRepository->getTimeSeriesStats(clone $baseQuery, $dateRange);

        $recallStats = $this->kpiRepository->getRecallStats($sourceFilter, $targetUserId, $dateRange);
        $recallByUser = ($isAdmin && ! $targetUserId) ? $this->kpiRepository->getRecallStatsByUser($sourceFilter, $dateRange) : [];

        $byBusinessType = $this->kpiRepository->getByBusinessTypeStats(clone $baseQuery);
        $byAllocation = $this->kpiRepository->getByAllocationStats(clone $baseQuery);

        $prevDateRange = $this->getDateRange('prev_'.($period === 'today' ? 'month' : $period), null, null);
        $comparison = $this->kpiRepository->getPeriodComparison($summary, $prevDateRange, $sourceFilter, $targetUserId);

        return [
            'period' => [
                'type' => $period,
                'start_date' => $dateRange['start']->format('Y-m-d'),
                'end_date' => $dateRange['end']->format('Y-m-d'),
                'label' => $dateRange['label'],
            ],
            'summary' => $summary,
            'by_source' => $bySource,
            'by_business_type' => $byBusinessType,
            'by_allocation' => $byAllocation,
            'by_user' => $byUser,
            'time_series' => $timeSeries,
            'recall_stats' => $recallStats,
            'recall_by_user' => $recallByUser,
            'comparison' => $comparison,
            'meta' => [
                'user_role' => $user->role,
                'is_team_view' => $isAdmin && ! $targetUserId,
                'target_user_id' => $targetUserId,
                'source_filter' => $sourceFilter,
            ],
        ];
    }

    /**
     * Get KPI Specific Details
     * 
     * @param \App\Models\User $user
     * @return array{data: mixed, meta: array<string, mixed>}
     */
    public function getKpiDetails(string $period, ?string $startDate, ?string $endDate, string $sourceFilter, string $kpiType, ?int $requestedUserId, $user, int $perPage): array
    {
        $dateRange = $this->getDateRange($period, $startDate, $endDate);
        $targetUserId = $this->getTargetUserId($requestedUserId, $user);

        $userColumn = ($kpiType === 'created_by') ? 'cus_created_by' : 'cus_allocated_by';
        $baseQuery = $this->kpiRepository->getBaseDashboardQuery($dateRange, $sourceFilter, $targetUserId, $userColumn);
        $customers = $this->kpiRepository->getPaginatedDetails($baseQuery, $kpiType, $perPage);

        $transformedData = $customers->map(function ($customer) {
            $allocatorName = $customer->allocatedBy
                ? trim($customer->allocatedBy->user_firstname.' '.$customer->allocatedBy->user_lastname.
                       ($customer->allocatedBy->user_nickname ? " ({$customer->allocatedBy->user_nickname})" : ''))
                : 'ไม่ระบุ';

            $fullNameParts = [];
            if (! empty($customer->cus_firstname)) {
                $fullNameParts[] = trim($customer->cus_firstname);
            }
            if (! empty($customer->cus_lastname)) {
                $fullNameParts[] = trim($customer->cus_lastname);
            }
            $fullNameStr = implode(' ', $fullNameParts);

            if (! empty($customer->cus_name)) {
                $fullNameStr = $fullNameStr ? $fullNameStr.' ('.trim($customer->cus_name).')' : trim($customer->cus_name);
            }

            return [
                'cus_id' => $customer->cus_id,
                'cus_no' => $customer->cus_no,
                'full_name' => $fullNameStr ?: '-',
                'company' => $customer->cus_company ?? '-',
                'mobile' => $customer->cus_tel_1 ?? '-',
                'source' => $this->getSourceLabel($customer->cus_source),
                'allocation_status' => $customer->cus_allocation_status,
                'sales_full_name' => $allocatorName,
                'created_date' => $customer->cus_created_date?->format('Y-m-d H:i:s'),
            ];
        });

        return [
            'data' => $transformedData,
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
                'kpi_type' => $kpiType,
            ],
        ];
    }

    /**
     * Get KPI Recall Specific Details
     * 
     * @param \App\Models\User $user
     * @return array{customers: mixed, current_page: int, last_page: int, per_page: int, total: int}
     */
    public function getRecallDetails(string $type, string $period, ?string $startDate, ?string $endDate, string $sourceFilter, ?int $requestedUserId, $user, int $perPage): array
    {
        $dateRange = $this->getDateRange($period, $startDate, $endDate);
        $targetUserId = $this->getTargetUserId($requestedUserId, $user);

        $paginator = $this->kpiRepository->getPaginatedRecallDetails($type, $sourceFilter, $targetUserId, $dateRange, $perPage);

        $customers = $paginator->map(function ($customer) {
            $fullNameParts = array_filter([$customer->cus_firstname, $customer->cus_lastname]);
            $fullName = ! empty($fullNameParts) ? implode(' ', $fullNameParts) : '-';
            if ($customer->cus_name) {
                $fullName .= " ({$customer->cus_name})";
            }

            /** @var string|null $mFname */
            $mFname = $customer->m_fname ?? null;
            /** @var string|null $mLname */
            $mLname = $customer->m_lname ?? null;
            $managerNameParts = array_filter([$mFname, $mLname]);
            $managerName = ! empty($managerNameParts) ? implode(' ', $managerNameParts) : 'ไม่ระบุผู้ดูแล';
            /** @var string|null $mUsername */
            $mUsername = $customer->m_username ?? null;
            if ($mUsername) {
                $managerName .= " ({$mUsername})";
            }

            return [
                'id' => $customer->cus_id,
                'cus_id' => $customer->cus_id,
                'full_name' => $fullName,
                'cus_firstname' => $customer->cus_firstname,
                'cus_lastname' => $customer->cus_lastname,
                'cus_name' => $customer->cus_name,
                'group_name' => $customer->group_name ?? null,
                'source' => $customer->cus_source,
                'manager_name' => $managerName,
            ];
        });

        return [
            'customers' => $customers,
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    /**
     * Get KPI Data for Export
     * 
     * @param \App\Models\User $user
     * @return array{customers: \Illuminate\Support\Collection<int, \App\Models\MasterCustomer>, filename: string}
     */
    public function getExportData(string $period, ?string $startDate, ?string $endDate, string $sourceFilter, ?int $requestedUserId, $user): array
    {
        $dateRange = $this->getDateRange($period, $startDate, $endDate);
        $targetUserId = $this->getTargetUserId($requestedUserId, $user);

        $baseQuery = $this->kpiRepository->getBaseDashboardQuery($dateRange, $sourceFilter, $targetUserId);
        $customers = $this->kpiRepository->getExportData($baseQuery);
        $filename = 'kpi_export_'.$dateRange['start']->format('Ymd').'_'.$dateRange['end']->format('Ymd').'.csv';

        return [
            'customers' => $customers,
            'filename' => $filename,
        ];
    }

    /**
     * Get Historical Recall
     * 
     * @param \App\Models\User $user
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\RecallStatusHistory>
     */
    public function getRecallHistory(string $month, string $sourceFilter, ?int $requestedUserId, $user)
    {
        $targetUserId = $this->getTargetUserId($requestedUserId, $user);

        return $this->kpiRepository->getRecallHistory($month, $sourceFilter, $targetUserId);
    }
}
