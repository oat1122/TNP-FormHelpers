<?php

namespace App\Http\Controllers\Api\V1\Customers;

use App\Http\Controllers\Controller;
use App\Helpers\AccountingHelper;
use App\Models\MasterCustomer;
use App\Models\RecallStatusHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * KPI Controller
 * 
 * Provides KPI dashboard statistics and CSV export for telesales/sales tracking.
 * Tracks customer additions by: day, week, month, quarter, year
 * Grouped by cus_source and cus_allocated_by.
 */
class KpiController extends Controller
{
    /**
     * Get KPI Dashboard Statistics
     * 
     * GET /api/v1/customers/kpi
     * 
     * @param Request $request
     * - period: today|week|month|quarter|year|custom (default: month)
     * - start_date: Y-m-d (required if period=custom)
     * - end_date: Y-m-d (required if period=custom)
     * - source_filter: telesales|sales|online|office|all (default: all)
     * - user_id: filter by specific user (admin/manager only)
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function dashboard(Request $request)
    {
        $user = auth()->user();
        
        // Check authorization - allow admin, manager, and telesales
        if (!AccountingHelper::hasRole(['admin', 'manager', 'telesale', 'sale'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Access denied'
            ], 403);
        }

        try {
            // Validate inputs
            $request->validate([
                'period' => 'nullable|in:today,week,month,quarter,year,custom,prev_month,prev_week,prev_quarter',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'source_filter' => 'nullable|in:telesales,sales,online,office,all',
                'user_id' => 'nullable|integer'
            ]);

            $period = $request->input('period', 'month');
            $sourceFilter = $request->input('source_filter', 'all');
            $isAdmin = AccountingHelper::hasRole(['admin', 'manager']);
            
            // Determine date range based on period
            $dateRange = $this->getDateRange($period, $request->start_date, $request->end_date);
            
            // Determine user scope
            $targetUserId = null;
            if ($request->user_id && $isAdmin) {
                $targetUserId = $request->user_id;
            } elseif (!$isAdmin) {
                $targetUserId = $user->user_id;
            }

            // Build base query
            $baseQuery = MasterCustomer::where('cus_is_use', true)
                ->whereBetween('cus_created_date', [$dateRange['start'], $dateRange['end']]);

            // Apply source filter
            if ($sourceFilter !== 'all') {
                $baseQuery->where('cus_source', $sourceFilter);
            }

            // Apply user filter
            if ($targetUserId) {
                $baseQuery->where('cus_allocated_by', $targetUserId);
            }

            // Get summary stats
            $summary = $this->getSummaryStats(clone $baseQuery);
            
            // Get by source breakdown
            $bySource = $this->getBySourceStats(clone $baseQuery);
            
            // Get by user breakdown (admin/manager only, or specific user)
            $byUser = $isAdmin ? $this->getByUserStats(clone $baseQuery) : [];
            
            // Get time series data (daily breakdown)
            $timeSeries = $this->getTimeSeriesStats(clone $baseQuery, $dateRange);

            // Get recall stats
            $recallStats = $this->getRecallStats($sourceFilter, $targetUserId, $dateRange);
            
            // Get recall stats by user (team view only)
            $recallByUser = ($isAdmin && !$targetUserId) ? $this->getRecallStatsByUser($sourceFilter, $dateRange) : [];

            // Get current period comparison (vs previous period)
            $comparison = $this->getPeriodComparison($period, $sourceFilter, $targetUserId);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'period' => [
                        'type' => $period,
                        'start_date' => $dateRange['start']->format('Y-m-d'),
                        'end_date' => $dateRange['end']->format('Y-m-d'),
                        'label' => $dateRange['label'],
                    ],
                    'summary' => $summary,
                    'by_source' => $bySource,
                    'by_user' => $byUser,
                    'by_user' => $byUser,
                    'time_series' => $timeSeries,
                    'recall_stats' => $recallStats,
                    'recall_by_user' => $recallByUser,
                    'comparison' => $comparison,
                ],
                'meta' => [
                    'user_role' => $user->role,
                    'is_team_view' => $isAdmin && !$targetUserId,
                    'target_user_id' => $targetUserId,
                    'source_filter' => $sourceFilter,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('KPI Dashboard error: ' . $e->getMessage(), [
                'user_id' => $user->user_id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching KPI stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get KPI Dashboard Details (List of customers for a specific KPI)
     * 
     * GET /api/v1/customers/kpi/details
     * 
     * @param Request $request
     * - period: today|week|month|quarter|year|custom (default: month)
     * - start_date: Y-m-d (required if period=custom)
     * - end_date: Y-m-d (required if period=custom)
     * - source_filter: telesales|sales|online|office|all (default: all)
     * - kpi_type: total|pool|allocated (required)
     * - user_id: filter by specific user (admin/manager only)
     * - page: pagination page
     * - per_page: items per page
     */
    public function details(Request $request)
    {
        $user = auth()->user();
        
        // Check authorization - allow admin, manager, and telesales
        if (!AccountingHelper::hasRole(['admin', 'manager', 'telesale', 'sale'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Access denied'
            ], 403);
        }

        try {
            // Validate inputs
            $request->validate([
                'period' => 'nullable|in:today,week,month,quarter,year,custom,prev_month,prev_week,prev_quarter',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'source_filter' => 'nullable|in:telesales,sales,online,office,all',
                'kpi_type' => 'required|in:total,pool,allocated',
                'user_id' => 'nullable|integer',
                'per_page' => 'nullable|integer|max:100',
            ]);

            $period = $request->input('period', 'month');
            $sourceFilter = $request->input('source_filter', 'all');
            $kpiType = $request->input('kpi_type');
            $perPage = $request->input('per_page', 10);
            $isAdmin = AccountingHelper::hasRole(['admin', 'manager']);
            
            // Determine date range
            $dateRange = $this->getDateRange($period, $request->start_date, $request->end_date);
            
            // Determine user scope
            $targetUserId = null;
            if ($request->user_id && $isAdmin) {
                $targetUserId = $request->user_id;
            } elseif (!$isAdmin) {
                $targetUserId = $user->user_id;
            }

            // Build base query
            $query = MasterCustomer::with(['allocatedBy:user_id,username,user_firstname,user_lastname,user_nickname'])
                ->where('cus_is_use', true)
                ->whereBetween('cus_created_date', [$dateRange['start'], $dateRange['end']]);

            // Apply source filter
            if ($sourceFilter !== 'all') {
                $query->where('cus_source', $sourceFilter);
            }

            // Apply user filter
            if ($targetUserId) {
                $query->where('cus_allocated_by', $targetUserId);
            }

            // Apply KPI specific filter
            if ($kpiType === 'pool') {
                $query->where('cus_allocation_status', 'pool');
            } elseif ($kpiType === 'allocated') {
                $query->where('cus_allocation_status', 'allocated');
            }
            // 'total' needs no further filtering

            // Order and paginate
            $customers = $query->orderBy('cus_created_date', 'desc')->paginate($perPage);

            // Transform for frontend DataGrid
            $transformedData = $customers->map(function ($customer) {
                $allocatorName = $customer->allocatedBy 
                    ? trim($customer->allocatedBy->user_firstname . ' ' . $customer->allocatedBy->user_lastname . 
                           ($customer->allocatedBy->user_nickname ? " ({$customer->allocatedBy->user_nickname})" : ''))
                    : 'ไม่ระบุ';

                // Build full name combining firstname, lastname, and nickname (cus_name)
                $fullNameParts = [];
                if (!empty($customer->cus_firstname)) $fullNameParts[] = trim($customer->cus_firstname);
                if (!empty($customer->cus_lastname)) $fullNameParts[] = trim($customer->cus_lastname);
                $fullNameStr = implode(' ', $fullNameParts);
                
                // If we also have a nickname (cus_name), append it
                if (!empty($customer->cus_name)) {
                    $fullNameStr = $fullNameStr ? $fullNameStr . ' (' . trim($customer->cus_name) . ')' : trim($customer->cus_name);
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

            return response()->json([
                'status' => 'success',
                'data' => $transformedData,
                'meta' => [
                    'current_page' => $customers->currentPage(),
                    'last_page' => $customers->lastPage(),
                    'per_page' => $customers->perPage(),
                    'total' => $customers->total(),
                    'kpi_type' => $kpiType,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('KPI Dashboard Details error: ' . $e->getMessage(), [
                'user_id' => $user->user_id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching details: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed list of customers for a specific Recall status type
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function recallDetails(Request $request)
    {
        try {
            // Check roles
            $user = auth()->user();
            $isTeamView = AccountingHelper::hasRole(['admin', 'manager', 'Head']);

            // Input parameters
            $type = $request->query('recall_type'); // 'waiting', 'in_criteria', 'made'
            $period = $request->query('period', 'month');
            $sourceFilter = $request->query('source_filter', 'all');
            $perPage = $request->query('per_page', 10);
            
            // Support custom date passing
            $customStartDate = $request->query('start_date');
            $customEndDate = $request->query('end_date');

            if (!in_array($type, ['waiting', 'in_criteria', 'made'])) {
                return response()->json(['success' => false, 'message' => 'Invalid recall type'], 400);
            }

            // Determine date range for filtering
            $dateRange = $this->getDateRange($period, $customStartDate, $customEndDate);
            $startDateStr = $dateRange['start']->format('Y-m-d H:i:s');
            $endDateStr = $dateRange['end']->format('Y-m-d H:i:s');

            // Determine target user (for team view vs personal view)
            $targetUserId = null;
            if (!$isTeamView) {
                // Personal view - only own data
                $targetUserId = $user->user_id;
            } elseif ($request->has('user_id') && $request->user_id !== 'all') {
                // Team view but filtering by specific user
                $targetUserId = $request->user_id;
            }

            // Base Query: Same join structure as recall counts
            $query = MasterCustomer::query()
                ->join('customer_details', 'master_customers.cus_id', '=', 'customer_details.cd_cus_id')
                ->join('master_customer_groups', 'master_customers.cus_mcg_id', '=', 'master_customer_groups.mcg_id')
                ->leftJoin('users', 'master_customers.cus_manage_by', '=', 'users.user_id')
                ->where('master_customers.cus_is_use', true)
                ->where('customer_details.cd_is_use', true);

            // Apply Source Filter
            if ($sourceFilter !== 'all') {
                $query->where('master_customers.cus_source', $sourceFilter);
            }

            // Apply User Filter
            if ($targetUserId) {
                $query->where('master_customers.cus_allocated_by', $targetUserId);
            }

            // Apply Recall Type Filter (Option D Hybrid Approach)
            switch ($type) {
                case 'waiting': // Overdue: < NOW()
                    $query->where('customer_details.cd_last_datetime', '<', Carbon::now());
                    break;
                case 'in_criteria': // In Criteria: >= NOW() (Ignore max date filter to show all future work queue)
                    $query->where('customer_details.cd_last_datetime', '>=', Carbon::now());
                    break;
                case 'made': // Recalls Made: updated within range
                    $query->whereBetween('customer_details.cd_updated_date', [$startDateStr, $endDateStr]);
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
                'customer_details.cd_note as status_note', // Changed from md_last_status
                'customer_details.cd_last_datetime',
                'customer_details.cd_updated_date',
                'master_customer_groups.mcg_name as group_name',
                'users.user_firstname as m_fname',
                'users.user_lastname as m_lname',
                'users.username as m_username'
            ]);

            // Default Sorting: closest/longest due date based on type
            if ($type === 'waiting') {
                $query->orderBy('customer_details.cd_last_datetime', 'asc'); // Oldest overdue first
            } elseif ($type === 'in_criteria') {
                $query->orderBy('customer_details.cd_last_datetime', 'asc'); // Upcoming closest first
            } else {
                $query->orderBy('customer_details.cd_updated_date', 'desc'); // Most recently made first
            }

            // Paginate
            $paginator = $query->paginate($perPage);

            // Transform data for frontend
            $customers = $paginator->map(function ($customer) {
                // Determine display name for customer
                $fullNameParts = array_filter([$customer->cus_firstname, $customer->cus_lastname]);
                $fullName = !empty($fullNameParts) ? implode(' ', $fullNameParts) : '-';
                if ($customer->cus_name) {
                     $fullName .= " ({$customer->cus_name})";
                }

                // Determine display manager name
                $managerNameParts = array_filter([$customer->m_fname, $customer->m_lname]);
                $managerName = !empty($managerNameParts) ? implode(' ', $managerNameParts) : 'ไม่ระบุผู้ดูแล';
                if ($customer->m_username) {
                    $managerName .= " ({$customer->m_username})";
                }

                return [
                    'id' => $customer->cus_id,
                    'cus_id' => $customer->cus_id,
                    'full_name' => $fullName,
                    'cus_firstname' => $customer->cus_firstname,
                    'cus_lastname' => $customer->cus_lastname,
                    'cus_name' => $customer->cus_name,
                    'group_name' => $customer->group_name,
                    'source' => $customer->cus_source,
                    'manager_name' => $managerName
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'customers' => $customers,
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('KPI Recall Details Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve recall details'
            ], 500);
        }
    }

    /**
     * Export KPI data to CSV
     * 
     * GET /api/v1/customers/kpi/export
     */
    public function export(Request $request): StreamedResponse
    {
        $user = auth()->user();
        
        if (!AccountingHelper::hasRole(['admin', 'manager', 'telesale', 'sale'])) {
            abort(403, 'Unauthorized');
        }

        $period = $request->input('period', 'month');
        $sourceFilter = $request->input('source_filter', 'all');
        $isAdmin = AccountingHelper::hasRole(['admin', 'manager']);
        
        $dateRange = $this->getDateRange($period, $request->start_date, $request->end_date);
        
        $targetUserId = null;
        if ($request->user_id && $isAdmin) {
            $targetUserId = $request->user_id;
        } elseif (!$isAdmin) {
            $targetUserId = $user->user_id;
        }

        // Build query
        $query = MasterCustomer::where('cus_is_use', true)
            ->whereBetween('cus_created_date', [$dateRange['start'], $dateRange['end']])
            ->with(['allocatedBy:user_id,username,user_firstname,user_lastname,user_nickname']);

        if ($sourceFilter !== 'all') {
            $query->where('cus_source', $sourceFilter);
        }

        if ($targetUserId) {
            $query->where('cus_allocated_by', $targetUserId);
        }

        $customers = $query->orderBy('cus_created_date', 'desc')->get();

        $filename = 'kpi_export_' . $dateRange['start']->format('Ymd') . '_' . $dateRange['end']->format('Ymd') . '.csv';

        return response()->streamDownload(function () use ($customers) {
            $handle = fopen('php://output', 'w');
            
            // UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Header row
            fputcsv($handle, [
                'รหัสลูกค้า',
                'ชื่อลูกค้า',
                'บริษัท',
                'เบอร์โทร',
                'แหล่งที่มา',
                'สถานะ',
                'ผู้เพิ่ม',
                'วันที่สร้าง',
            ]);

            foreach ($customers as $customer) {
                $allocatorName = $customer->allocatedBy 
                    ? trim($customer->allocatedBy->user_firstname . ' ' . $customer->allocatedBy->user_lastname . 
                           ($customer->allocatedBy->user_nickname ? " ({$customer->allocatedBy->user_nickname})" : ''))
                    : 'ไม่ระบุ';

                fputcsv($handle, [
                    $customer->cus_no,
                    $customer->cus_name ?? '-',
                    $customer->cus_company ?? '-',
                    $customer->cus_tel_1 ?? '-',
                    $this->getSourceLabel($customer->cus_source),
                    $customer->cus_allocation_status === 'pool' ? 'รอจัดสรร' : 'จัดสรรแล้ว',
                    $allocatorName,
                    $customer->cus_created_date?->format('Y-m-d H:i') ?? '-',
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    /**
     * Get date range based on period type
     */
    private function getDateRange(string $period, ?string $startDate, ?string $endDate): array
    {
        // If start_date and end_date are explicitly provided, always use them
        if ($startDate && $endDate) {
            $start = Carbon::parse($startDate)->startOfDay();
            $end = Carbon::parse($endDate)->endOfDay();
            return [
                'start' => $start,
                'end' => $end,
                'label' => $start->format('d/m/Y') . ' - ' . $end->format('d/m/Y'),
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
                    'label' => 'ไตรมาสนี้ (Q' . $now->quarter . ')',
                ];
            case 'year':
                return [
                    'start' => $now->copy()->startOfYear(),
                    'end' => $now->copy()->endOfYear(),
                    'label' => 'ปีนี้ (' . $now->year . ')',
                ];
            case 'custom':
                $start = Carbon::parse($startDate)->startOfDay();
                $end = Carbon::parse($endDate)->endOfDay();
                return [
                    'start' => $start,
                    'end' => $end,
                    'label' => $start->format('d/m/Y') . ' - ' . $end->format('d/m/Y'),
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
                    'label' => 'ไตรมาสที่แล้ว (Q' . $now->copy()->subQuarter()->quarter . ')',
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
     * Get summary statistics
     */
    private function getSummaryStats($query): array
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
     */
    private function getBySourceStats($query): array
    {
        return $query->select('cus_source', DB::raw('COUNT(*) as count'))
            ->groupBy('cus_source')
            ->get()
            ->map(fn($item) => [
                'source' => $item->cus_source ?? 'unknown',
                'label' => $this->getSourceLabel($item->cus_source),
                'count' => $item->count,
            ])
            ->toArray();
    }

    /**
     * Get statistics grouped by user (cus_allocated_by)
     */
    private function getByUserStats($query): array
    {
        $stats = $query->select('cus_allocated_by', DB::raw('COUNT(*) as count'))
            ->whereNotNull('cus_allocated_by')
            ->groupBy('cus_allocated_by')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        $userIds = $stats->pluck('cus_allocated_by')->unique();
        $users = User::whereIn('user_id', $userIds)
            ->select('user_id', 'username', 'user_firstname', 'user_lastname', 'user_nickname')
            ->get()
            ->keyBy('user_id');

        return $stats->map(function ($stat) use ($users) {
            $user = $users->get($stat->cus_allocated_by);
            $fullName = $user 
                ? trim($user->user_firstname . ' ' . $user->user_lastname . 
                       ($user->user_nickname ? " ({$user->user_nickname})" : ''))
                : 'Unknown';
            
            return [
                'user_id' => $stat->cus_allocated_by,
                'username' => $user->username ?? 'Unknown',
                'full_name' => $fullName,
                'count' => $stat->count,
            ];
        })->toArray();
    }

    /**
     * Get time series data (daily breakdown)
     */
    private function getTimeSeriesStats($query, array $dateRange): array
    {
        return $query->select(
            DB::raw('DATE(cus_created_date) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->groupBy(DB::raw('DATE(cus_created_date)'))
            ->orderBy('date')
            ->get()
            ->map(fn($item) => [
                'date' => $item->date,
                'count' => $item->count,
            ])
            ->toArray();
    }

    /**
     * Get Recall Statistics
     * 
     * @param string $sourceFilter
     * @param int|null $targetUserId
     * @return array
     */
    /**
     * Get Recall Statistics
     * 
     * @param string $sourceFilter
     * @param int|null $targetUserId
     * @param array $dateRange
     * @return array
     */
    private function getRecallStats(string $sourceFilter, ?int $targetUserId, array $dateRange): array
    {
        // Base query for recall stats - join with details and groups
        $query = MasterCustomer::query()
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
        $endDateStr = $dateRange['end']->format('Y-m-d H:i:s');

        // 1. Waiting for recall (Overdue)
        // Option D: cd_last_datetime < NOW() (No date filter applied, always show all overdue)
        $waitingCount = $q1->where('customer_details.cd_last_datetime', '<', Carbon::now())
            ->count();

        // 2. In criteria
        // Show all future schedule (Ignore end date so it matches the real customer list pending workload)
        $inCriteriaCount = $q2->where('customer_details.cd_last_datetime', '>=', Carbon::now())
            ->count();

        // 3. Recalls made in period
        // Option D: cd_updated_date BETWEEN startDate AND endDate
        $recallsMadeCount = $q3->whereBetween('customer_details.cd_updated_date', [$startDateStr, $endDateStr])
            ->count();

        return [
            'total_waiting' => $waitingCount,
            'total_in_criteria' => $inCriteriaCount,
            'recalls_made_count' => $recallsMadeCount,
        ];
    }

    /**
     * Get Recall Statistics By User (Sales)
     * 
     * @param string $sourceFilter
     * @param array $dateRange
     * @return array
     */
    private function getRecallStatsByUser(string $sourceFilter, array $dateRange): array
    {
        $startDate = $dateRange['start']->format('Y-m-d H:i:s');
        $endDate = $dateRange['end']->format('Y-m-d H:i:s');

        // Base query - join MasterCustomer with details and groups
        $query = MasterCustomer::query()
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
                // Waiting for recall (Overdue): cd_last_datetime < NOW (No filter date)
                DB::raw('SUM(CASE WHEN customer_details.cd_last_datetime < NOW() THEN 1 ELSE 0 END) as waiting_count'),
                // In Criteria: >= NOW() (Ignore date filter for current workload visibility)
                DB::raw("SUM(CASE WHEN customer_details.cd_last_datetime >= NOW() THEN 1 ELSE 0 END) as in_criteria_count"),
                // Recalls Made In Period: cd_updated_date in range
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
            ->orderByDesc('waiting_count');

        if ($sourceFilter !== 'all') {
            $query->where('master_customers.cus_source', $sourceFilter);
        }

        return $query->get()->map(function ($item) {
            $fullName = trim($item->user_firstname . ' ' . $item->user_lastname . 
                ($item->user_nickname ? " ({$item->user_nickname})" : ''));
                
            return [
                'user_id' => $item->user_id,
                'username' => $item->username,
                'full_name' => $fullName,
                'total_customers' => (int)$item->total_customers,
                'waiting_count' => (int)$item->waiting_count,
                'in_criteria_count' => (int)$item->in_criteria_count,
                'recalls_made_count' => (int)$item->recalls_made_count,
            ];
        })->toArray();
    }

    /**
     * Get comparison with previous period
     */
    private function getPeriodComparison(string $period, string $sourceFilter, ?int $targetUserId): array
    {
        if ($period === 'custom') {
            return ['previous' => null, 'change' => null, 'change_percent' => null];
        }

        $now = Carbon::now();
        
        // Calculate previous period
        switch ($period) {
            case 'today':
                $prevStart = $now->copy()->subDay()->startOfDay();
                $prevEnd = $now->copy()->subDay()->endOfDay();
                break;
            case 'week':
                $prevStart = $now->copy()->subWeek()->startOfWeek();
                $prevEnd = $now->copy()->subWeek()->endOfWeek();
                break;
            case 'month':
                $prevStart = $now->copy()->subMonth()->startOfMonth();
                $prevEnd = $now->copy()->subMonth()->endOfMonth();
                break;
            case 'quarter':
                $prevStart = $now->copy()->subQuarter()->startOfQuarter();
                $prevEnd = $now->copy()->subQuarter()->endOfQuarter();
                break;
            case 'year':
                $prevStart = $now->copy()->subYear()->startOfYear();
                $prevEnd = $now->copy()->subYear()->endOfYear();
                break;
            default:
                return ['previous' => null, 'change' => null, 'change_percent' => null];
        }

        $query = MasterCustomer::where('cus_is_use', true)
            ->whereBetween('cus_created_date', [$prevStart, $prevEnd]);

        if ($sourceFilter !== 'all') {
            $query->where('cus_source', $sourceFilter);
        }

        if ($targetUserId) {
            $query->where('cus_allocated_by', $targetUserId);
        }

        $previousCount = $query->count();

        // Get current count for comparison
        $currentRange = $this->getDateRange($period, null, null);
        $currentQuery = MasterCustomer::where('cus_is_use', true)
            ->whereBetween('cus_created_date', [$currentRange['start'], $currentRange['end']]);

        if ($sourceFilter !== 'all') {
            $currentQuery->where('cus_source', $sourceFilter);
        }

        if ($targetUserId) {
            $currentQuery->where('cus_allocated_by', $targetUserId);
        }

        $currentCount = $currentQuery->count();
        $change = $currentCount - $previousCount;
        $changePercent = $previousCount > 0 
            ? round(($change / $previousCount) * 100, 1) 
            : ($currentCount > 0 ? 100 : 0);

        return [
            'previous' => $previousCount,
            'current' => $currentCount,
            'change' => $change,
            'change_percent' => $changePercent,
        ];
    }

    /**
     * Get historical recall status for trend analysis and drill-down
     * GET /api/v1/customers/kpi/recall-history
     */
    public function recallHistory(Request $request)
    {
        try {
            $user = auth()->user();
            $isTeamView = AccountingHelper::hasRole(['admin', 'manager', 'Head']);

            $targetUserId = null;
            if (!$isTeamView) {
                $targetUserId = $user->user_id;
            } elseif ($request->has('user_id') && $request->user_id !== 'all') {
                $targetUserId = $request->user_id;
            }

            // Parameters
            $month = $request->query('month'); // format: YYYY-MM
            $status = $request->query('status'); // 'overdue' or 'in_criteria'
            $sourceFilter = $request->query('source_filter', 'all');

            if (!$month) {
                // If no month provided, return aggregate trend (e.g., last 6 months)
                $query = RecallStatusHistory::query()
                    ->selectRaw("DATE_FORMAT(snapshot_date, '%Y-%m') as month")
                    ->selectRaw("SUM(CASE WHEN recall_status = 'overdue' THEN 1 ELSE 0 END) as overdue_count")
                    ->selectRaw("SUM(CASE WHEN recall_status = 'in_criteria' THEN 1 ELSE 0 END) as in_criteria_count")
                    ->groupByRaw("DATE_FORMAT(snapshot_date, '%Y-%m')")
                    ->orderBy('month', 'desc')
                    ->limit(6);

                if ($targetUserId) $query->where('manage_by', $targetUserId);
                if ($sourceFilter !== 'all') $query->where('source', $sourceFilter);

                // For monthly trends, we want the LAST snapshot of the month
                // This is a simplified approach. In a complex app you might join with a max(date) subquery
                $query->whereRaw("snapshot_date IN (SELECT MAX(snapshot_date) FROM recall_status_histories GROUP BY DATE_FORMAT(snapshot_date, '%Y-%m'))");

                return response()->json([
                    'success' => true,
                    'data' => $query->get()
                ]);
            }

            // --- Drill-down for a specific month ---
            $startDate = Carbon::parse($month . '-01')->startOfMonth();
            $endDate = $startDate->copy()->endOfMonth();

            // Find the last snapshot available in that month
            $lastSnapshotDate = RecallStatusHistory::whereBetween('snapshot_date', [$startDate, $endDate])
                ->max('snapshot_date');

            if (!$lastSnapshotDate) {
                return response()->json(['success' => true, 'data' => []]);
            }

            $query = RecallStatusHistory::where('snapshot_date', $lastSnapshotDate)
                ->leftJoin('users', 'recall_status_histories.manage_by', '=', 'users.user_id');

            if ($targetUserId) $query->where('manage_by', $targetUserId);
            if ($sourceFilter !== 'all') $query->where('source', $sourceFilter);
            if ($status) $query->where('recall_status', $status);

            $query->select([
                'recall_status_histories.*',
                'users.user_firstname as m_fname',
                'users.user_lastname as m_lname',
                'users.username as m_username'
            ]);

            $records = $query->orderByDesc('days_overdue')->get();

            // Transform data for frontend specifically for history view to match dialog fields
            $mappedRecords = $records->map(function ($record) {
                // Determine display manager name
                $managerNameParts = array_filter([$record->m_fname, $record->m_lname]);
                $managerName = !empty($managerNameParts) ? implode(' ', $managerNameParts) : 'ไม่ระบุผู้ดูแล';
                if ($record->m_username) {
                    $managerName .= " ({$record->m_username})";
                }

                return [
                    'id' => $record->id,
                    'cus_id' => $record->customer_id,
                    'full_name' => $record->customer_name ?: 'ไม่ระบุชื่อ',
                    'source' => $record->source,
                    'manager_name' => $managerName
                ];
            });

            return response()->json([
                'success' => true,
                'snapshot_date' => $lastSnapshotDate,
                'data' => $mappedRecords
            ]);

        } catch (\Exception $e) {
            \Log::error('Recall History Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching recall history: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Thai label for source
     */
    private function getSourceLabel(?string $source): string
    {
        return match ($source) {
            'telesales' => 'Telesales',
            'sales' => 'Sales',
            'online' => 'Online',
            'office' => 'Office',
            default => 'ไม่ระบุ',
        };
    }
}
