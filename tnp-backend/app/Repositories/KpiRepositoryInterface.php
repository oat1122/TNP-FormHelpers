<?php

namespace App\Repositories;

use Illuminate\Database\Eloquent\Builder;

interface KpiRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get base KPI dashboard query
     *
     * @param array<string, string> $dateRange
     * @return Builder<\App\Models\MasterCustomer>
     */
    public function getBaseDashboardQuery(array $dateRange, string $sourceFilter, ?int $targetUserId): Builder;

    /**
     * Get summary statistics
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @return array<string, mixed>
     */
    public function getSummaryStats(Builder $query): array;

    /**
     * Get statistics grouped by source
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @return array<string, mixed>
     */
    public function getBySourceStats(Builder $query): array;

    /**
     * Get statistics grouped by business type
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @return array<int, mixed>
     */
    public function getByBusinessTypeStats(Builder $query): array;

    /**
     * Get statistics for allocation status
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @return array<int, mixed>
     */
    public function getByAllocationStats(Builder $query): array;

    /**
     * Get statistics grouped by user (cus_allocated_by)
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @return array<int, mixed>
     */
    public function getByUserStats(Builder $query): array;

    /**
     * Get time series data (daily breakdown)
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @param array<string, string> $dateRange
     * @return array<string, mixed>
     */
    public function getTimeSeriesStats(Builder $query, array $dateRange): array;

    /**
     * Get Recall Statistics
     *
     * @param string $sourceFilter
     * @param int|null $targetUserId
     * @param array<string, \Carbon\Carbon> $dateRange
     * @param bool $useSnapshot Use recall_status_histories snapshot for past periods
     * @return array<string, int>
     */
    public function getRecallStats(string $sourceFilter, ?int $targetUserId, array $dateRange, bool $useSnapshot = false): array;

    /**
     * Get Recall Statistics By User (Sales)
     *
     * @param string $sourceFilter
     * @param array<string, \Carbon\Carbon> $dateRange
     * @param bool $useSnapshot Use recall_status_histories snapshot for past periods
     * @return array<int, mixed>
     */
    public function getRecallStatsByUser(string $sourceFilter, array $dateRange, bool $useSnapshot = false): array;

    /**
     * Get current period comparison (vs previous period)
     *
     * @param array<string, mixed> $currentStats
     * @param array<string, string> $prevDateRange
     * @param string $sourceFilter
     * @param int|null $targetUserId
     * @return array<string, mixed>
     */
    public function getPeriodComparison(array $currentStats, array $prevDateRange, string $sourceFilter, ?int $targetUserId): array;

    /**
     * Get paginated KPI details
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @param string $kpiType
     * @param int $perPage
     * @return \Illuminate\Pagination\LengthAwarePaginator<\App\Models\MasterCustomer>
     */
    public function getPaginatedDetails(Builder $query, string $kpiType, int $perPage);

    /**
     * Get detailed list of customers for a specific Recall status type
     *
     * @param string $type
     * @param string $sourceFilter
     * @param int|null $targetUserId
     * @param array<string, \Carbon\Carbon> $dateRange
     * @param int $perPage
     * @param bool $useSnapshot Use recall_status_histories snapshot for past periods
     * @return \Illuminate\Pagination\LengthAwarePaginator<\App\Models\MasterCustomer>
     */
    public function getPaginatedRecallDetails(string $type, string $sourceFilter, ?int $targetUserId, array $dateRange, int $perPage, bool $useSnapshot = false);

    /**
     * Get historical recall status for trend analysis and drill-down
     *
     * @param string $month
     * @param string $sourceFilter
     * @param int|null $targetUserId
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\RecallStatusHistory>
     */
    public function getRecallHistory(string $month, string $sourceFilter, ?int $targetUserId);

    /**
     * Export KPI data to collection
     *
     * @param Builder<\App\Models\MasterCustomer> $query
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\MasterCustomer>
     */
    public function getExportData(Builder $query);

    /**
     * Get base notebook lead KPI query.
     *
     * @param array<string, \Carbon\Carbon> $dateRange
     * @return Builder<\App\Models\Notebook>
     */
    public function getNotebookLeadBaseQuery(array $dateRange, string $sourceFilter, ?int $targetUserId): Builder;

    /**
     * Get summary statistics for notebook lead KPI.
     *
     * @param Builder<\App\Models\Notebook> $query
     * @return array<string, mixed>
     */
    public function getNotebookLeadSummaryStats(Builder $query): array;

    /**
     * Get statistics grouped by source for notebook lead KPI.
     *
     * @param Builder<\App\Models\Notebook> $query
     * @return array<int, mixed>
     */
    public function getNotebookLeadBySourceStats(Builder $query): array;

    /**
     * Get statistics grouped by business type for notebook lead KPI.
     *
     * @param Builder<\App\Models\Notebook> $query
     * @return array<int, mixed>
     */
    public function getNotebookLeadByBusinessTypeStats(Builder $query): array;

    /**
     * Get statistics for queue/claimed state for notebook leads.
     *
     * @param Builder<\App\Models\Notebook> $query
     * @return array<int, mixed>
     */
    public function getNotebookLeadByAllocationStats(Builder $query): array;

    /**
     * Get daily notebook lead additions for the selected period.
     *
     * @param Builder<\App\Models\Notebook> $query
     * @param array<string, \Carbon\Carbon> $dateRange
     * @return array<int, mixed>
     */
    public function getNotebookLeadTimeSeriesStats(Builder $query, array $dateRange): array;

    /**
     * Compare notebook lead additions to previous period.
     *
     * @param array<string, mixed> $currentStats
     * @param array<string, \Carbon\Carbon> $prevDateRange
     * @return array<string, mixed>
     */
    public function getNotebookLeadPeriodComparison(array $currentStats, array $prevDateRange, string $sourceFilter, ?int $targetUserId): array;

    /**
     * Get paginated notebook leads for KPI detail dialogs.
     *
     * @param Builder<\App\Models\Notebook> $query
     * @return \Illuminate\Pagination\LengthAwarePaginator<\App\Models\Notebook>
     */
    public function getNotebookLeadPaginatedDetails(Builder $query, string $kpiType, int $perPage);

    /**
     * Export notebook lead KPI rows.
     *
     * @param Builder<\App\Models\Notebook> $query
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\Notebook>
     */
    public function getNotebookLeadExportData(Builder $query);
}
