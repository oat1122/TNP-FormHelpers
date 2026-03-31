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
     * @return array{start: Carbon, end: Carbon, label: string}
     */
    public function getDateRange(string $period, ?string $startDate, ?string $endDate): array
    {
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
                    'label' => 'เธงเธฑเธเธเธตเน',
                ];
            case 'week':
                return [
                    'start' => $now->copy()->startOfWeek(),
                    'end' => $now->copy()->endOfWeek(),
                    'label' => 'เธชเธฑเธเธ”เธฒเธซเนเธเธตเน',
                ];
            case 'month':
                return [
                    'start' => $now->copy()->startOfMonth(),
                    'end' => $now->copy()->endOfMonth(),
                    'label' => 'เน€เธ”เธทเธญเธเธเธตเน',
                ];
            case 'quarter':
                return [
                    'start' => $now->copy()->startOfQuarter(),
                    'end' => $now->copy()->endOfQuarter(),
                    'label' => 'เนเธ•เธฃเธกเธฒเธชเธเธตเน (Q'.$now->quarter.')',
                ];
            case 'year':
                return [
                    'start' => $now->copy()->startOfYear(),
                    'end' => $now->copy()->endOfYear(),
                    'label' => 'เธเธตเธเธตเน ('.$now->year.')',
                ];
            case 'custom':
                $start = Carbon::parse($startDate)->startOfDay();
                $end = Carbon::parse($endDate)->endOfDay();

                return [
                    'start' => $start,
                    'end' => $end,
                    'label' => $start->format('d/m/Y').' - '.$end->format('d/m/Y'),
                ];
            case 'prev_month':
                return [
                    'start' => $now->copy()->subMonth()->startOfMonth(),
                    'end' => $now->copy()->subMonth()->endOfMonth(),
                    'label' => 'เน€เธ”เธทเธญเธเธ—เธตเนเนเธฅเนเธง',
                ];
            case 'prev_week':
                return [
                    'start' => $now->copy()->subWeek()->startOfWeek(),
                    'end' => $now->copy()->subWeek()->endOfWeek(),
                    'label' => 'เธชเธฑเธเธ”เธฒเธซเนเธ—เธตเนเนเธฅเนเธง',
                ];
            case 'prev_quarter':
                return [
                    'start' => $now->copy()->subQuarter()->startOfQuarter(),
                    'end' => $now->copy()->subQuarter()->endOfQuarter(),
                    'label' => 'เนเธ•เธฃเธกเธฒเธชเธ—เธตเนเนเธฅเนเธง (Q'.$now->copy()->subQuarter()->quarter.')',
                ];
            default:
                return [
                    'start' => $now->copy()->startOfMonth(),
                    'end' => $now->copy()->endOfMonth(),
                    'label' => 'เน€เธ”เธทเธญเธเธเธตเน',
                ];
        }
    }

    public function getSourceLabel(?string $source): string
    {
        return match ($source) {
            'telesales' => 'Telesales',
            'sales' => 'Sales',
            'online' => 'Online',
            'office' => 'Office',
            default => $source ?? 'เนเธกเนเธฃเธฐเธเธธ',
        };
    }

    public function getTargetUserId(?int $requestedUserId, $user): ?int
    {
        $isAdmin = AccountingHelper::hasRole(['admin', 'manager']);
        if ($requestedUserId && $isAdmin) {
            return $requestedUserId;
        }

        if (! $isAdmin) {
            return $user->user_id;
        }

        return null;
    }

    public function getDashboardData(string $period, ?string $startDate, ?string $endDate, string $sourceFilter, ?int $requestedUserId, $user): array
    {
        $isAdmin = AccountingHelper::hasRole(['admin', 'manager']);
        $dateRange = $this->getDateRange($period, $startDate, $endDate);
        $targetUserId = $this->getTargetUserId($requestedUserId, $user);

        $baseQuery = $this->kpiRepository->getBaseDashboardQuery($dateRange, $sourceFilter, $targetUserId);

        $summary = $this->kpiRepository->getSummaryStats(clone $baseQuery);
        $bySource = $this->kpiRepository->getBySourceStats(clone $baseQuery);
        $byUser = $isAdmin ? $this->kpiRepository->getByUserStats(clone $baseQuery) : [];
        $timeSeries = $this->kpiRepository->getTimeSeriesStats(clone $baseQuery, $dateRange);

        $isPastPeriod = $dateRange['end']->lt(Carbon::today()->startOfDay());

        $recallStats = $this->kpiRepository->getRecallStats($sourceFilter, $targetUserId, $dateRange, $isPastPeriod);
        $recallByUser = ($isAdmin && ! $targetUserId)
            ? $this->kpiRepository->getRecallStatsByUser($sourceFilter, $dateRange, $isPastPeriod)
            : [];

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

    public function getKpiDetails(string $period, ?string $startDate, ?string $endDate, string $sourceFilter, string $kpiType, ?int $requestedUserId, $user, int $perPage): array
    {
        $dateRange = $this->getDateRange($period, $startDate, $endDate);
        $targetUserId = $this->getTargetUserId($requestedUserId, $user);

        $userColumn = $kpiType === 'created_by' ? 'cus_created_by' : 'cus_allocated_by';
        $baseQuery = $this->kpiRepository->getBaseDashboardQuery($dateRange, $sourceFilter, $targetUserId, $userColumn);
        $customers = $this->kpiRepository->getPaginatedDetails($baseQuery, $kpiType, $perPage);

        $transformedData = $customers->map(function ($customer) {
            $allocatorName = $customer->allocatedBy
                ? trim($customer->allocatedBy->user_firstname.' '.$customer->allocatedBy->user_lastname.
                    ($customer->allocatedBy->user_nickname ? " ({$customer->allocatedBy->user_nickname})" : ''))
                : 'เนเธกเนเธฃเธฐเธเธธ';

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

    public function getRecallDetails(string $type, string $period, ?string $startDate, ?string $endDate, string $sourceFilter, ?int $requestedUserId, $user, int $perPage): array
    {
        $dateRange = $this->getDateRange($period, $startDate, $endDate);
        $targetUserId = $this->getTargetUserId($requestedUserId, $user);
        $isPastPeriod = $dateRange['end']->lt(Carbon::today()->startOfDay());

        $paginator = $this->kpiRepository->getPaginatedRecallDetails($type, $sourceFilter, $targetUserId, $dateRange, $perPage, $isPastPeriod);

        $customers = $paginator->map(function ($customer) {
            $fullNameParts = array_filter([$customer->cus_firstname, $customer->cus_lastname]);
            $fullName = ! empty($fullNameParts) ? implode(' ', $fullNameParts) : '-';
            if ($customer->cus_name) {
                $fullName .= " ({$customer->cus_name})";
            }

            $managerNameParts = array_filter([$customer->m_fname ?? null, $customer->m_lname ?? null]);
            $managerName = ! empty($managerNameParts) ? implode(' ', $managerNameParts) : 'เนเธกเนเธฃเธฐเธเธธเธเธนเนเธ”เธนเนเธฅ';
            if ($customer->m_username ?? null) {
                $managerName .= " ({$customer->m_username})";
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

    public function getRecallHistory(string $month, string $sourceFilter, ?int $requestedUserId, $user)
    {
        $targetUserId = $this->getTargetUserId($requestedUserId, $user);

        return $this->kpiRepository->getRecallHistory($month, $sourceFilter, $targetUserId);
    }
}
