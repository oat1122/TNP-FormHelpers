<?php

namespace App\Http\Controllers\Api\V1\Customers;

use App\Http\Controllers\Controller;
use App\Helpers\AccountingHelper;
use App\Models\MasterCustomer;
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
                'period' => 'nullable|in:today,week,month,quarter,year,custom',
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
                    'time_series' => $timeSeries,
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
