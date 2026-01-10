<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Helpers\AccountingHelper;
use App\Models\MasterCustomer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StatsController extends Controller
{
    /**
     * Get daily customer statistics
     * Returns customer counts grouped by creator for the specified date range
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function dailyCustomers(Request $request)
    {
        // Check permission
        if (!AccountingHelper::canViewReports()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Only admin and manager can view reports'
            ], 403);
        }

        try {
            // Validate date inputs
            $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'group_by' => 'nullable|in:user,source,date'
            ]);

            $startDate = $request->input('start_date', now()->startOfMonth()->format('Y-m-d'));
            $endDate = $request->input('end_date', now()->format('Y-m-d'));
            $groupBy = $request->input('group_by', 'user'); // Default group by user

            // Base query
            $query = MasterCustomer::whereBetween('cus_created_date', [$startDate, $endDate])
                ->where('cus_is_use', true);

            if ($groupBy === 'user') {
                // Group by user who created the customer
                $stats = $query
                    ->select(
                        'cus_created_by',
                        DB::raw('COUNT(*) as total_customers'),
                        DB::raw('SUM(CASE WHEN cus_source = "telesales" THEN 1 ELSE 0 END) as telesales_count'),
                        DB::raw('SUM(CASE WHEN cus_source = "sales" THEN 1 ELSE 0 END) as sales_count'),
                        DB::raw('SUM(CASE WHEN cus_source = "online" THEN 1 ELSE 0 END) as online_count'),
                        DB::raw('SUM(CASE WHEN cus_source = "office" THEN 1 ELSE 0 END) as office_count'),
                        DB::raw('SUM(CASE WHEN cus_allocation_status = "pool" THEN 1 ELSE 0 END) as in_pool'),
                        DB::raw('SUM(CASE WHEN cus_allocation_status = "allocated" THEN 1 ELSE 0 END) as allocated')
                    )
                    ->groupBy('cus_created_by')
                    ->get();

                // Enrich with user information
                $userIds = $stats->pluck('cus_created_by')->unique();
                $users = User::whereIn('user_id', $userIds)
                    ->select('user_id', 'username', 'user_firstname', 'user_lastname', 'role')
                    ->get()
                    ->keyBy('user_id');

                $result = $stats->map(function ($stat) use ($users) {
                    $user = $users->get($stat->cus_created_by);
                    return [
                        'user_id' => $stat->cus_created_by,
                        'username' => $user->username ?? 'Unknown',
                        'full_name' => $user ? ($user->user_firstname . ' ' . $user->user_lastname) : 'Unknown',
                        'role' => $user->role ?? 'Unknown',
                        'total_customers' => $stat->total_customers,
                        'by_source' => [
                            'telesales' => $stat->telesales_count,
                            'sales' => $stat->sales_count,
                            'online' => $stat->online_count,
                            'office' => $stat->office_count,
                        ],
                        'by_status' => [
                            'in_pool' => $stat->in_pool,
                            'allocated' => $stat->allocated,
                        ]
                    ];
                });

            } elseif ($groupBy === 'source') {
                // Group by customer source
                $stats = $query
                    ->select(
                        'cus_source',
                        DB::raw('COUNT(*) as total_customers'),
                        DB::raw('SUM(CASE WHEN cus_allocation_status = "pool" THEN 1 ELSE 0 END) as in_pool'),
                        DB::raw('SUM(CASE WHEN cus_allocation_status = "allocated" THEN 1 ELSE 0 END) as allocated')
                    )
                    ->groupBy('cus_source')
                    ->get();

                $result = $stats->map(function ($stat) {
                    return [
                        'source' => $stat->cus_source,
                        'total_customers' => $stat->total_customers,
                        'in_pool' => $stat->in_pool,
                        'allocated' => $stat->allocated,
                    ];
                });

            } else { // group_by === 'date'
                // Group by date
                $stats = $query
                    ->select(
                        DB::raw('DATE(cus_created_date) as date'),
                        DB::raw('COUNT(*) as total_customers'),
                        DB::raw('SUM(CASE WHEN cus_source = "telesales" THEN 1 ELSE 0 END) as telesales_count'),
                        DB::raw('SUM(CASE WHEN cus_source = "sales" THEN 1 ELSE 0 END) as sales_count'),
                        DB::raw('SUM(CASE WHEN cus_allocation_status = "pool" THEN 1 ELSE 0 END) as in_pool'),
                        DB::raw('SUM(CASE WHEN cus_allocation_status = "allocated" THEN 1 ELSE 0 END) as allocated')
                    )
                    ->groupBy(DB::raw('DATE(cus_created_date)'))
                    ->orderBy('date', 'asc')
                    ->get();

                $result = $stats->map(function ($stat) {
                    return [
                        'date' => $stat->date,
                        'total_customers' => $stat->total_customers,
                        'by_source' => [
                            'telesales' => $stat->telesales_count,
                            'sales' => $stat->sales_count,
                        ],
                        'by_status' => [
                            'in_pool' => $stat->in_pool,
                            'allocated' => $stat->allocated,
                        ]
                    ];
                });
            }

            // Overall summary
            $overallStats = MasterCustomer::whereBetween('cus_created_date', [$startDate, $endDate])
                ->where('cus_is_use', true)
                ->select(
                    DB::raw('COUNT(*) as total_customers'),
                    DB::raw('SUM(CASE WHEN cus_source = "telesales" THEN 1 ELSE 0 END) as telesales_total'),
                    DB::raw('SUM(CASE WHEN cus_source = "sales" THEN 1 ELSE 0 END) as sales_total'),
                    DB::raw('SUM(CASE WHEN cus_allocation_status = "pool" THEN 1 ELSE 0 END) as pool_total'),
                    DB::raw('SUM(CASE WHEN cus_allocation_status = "allocated" THEN 1 ELSE 0 END) as allocated_total')
                )
                ->first();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'period' => [
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'summary' => [
                        'total_customers' => $overallStats->total_customers,
                        'by_source' => [
                            'telesales' => $overallStats->telesales_total,
                            'sales' => $overallStats->sales_total,
                        ],
                        'by_status' => [
                            'in_pool' => $overallStats->pool_total,
                            'allocated' => $overallStats->allocated_total,
                        ]
                    ],
                    'grouped_by' => $groupBy,
                    'details' => $result
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Daily customers stats error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching daily statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get comprehensive dashboard stats for telesales with role-based data scope
     * Supports date range filtering and team overview for admin/manager
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function telesalesDashboard(Request $request)
    {
        $user = auth()->user();
        
        // Check authorization - allow admin, manager, and telesales
        if (!AccountingHelper::hasRole(['admin', 'manager', 'telesale'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Access denied'
            ], 403);
        }

        try {
            // Validate inputs
            $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'target_user_id' => 'nullable|integer'
            ]);

            // Validate date range
            if ($request->start_date && $request->end_date) {
                $startDate = \Carbon\Carbon::parse($request->start_date);
                $endDate = \Carbon\Carbon::parse($request->end_date);
                
                if ($startDate->gt($endDate)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด'
                    ], 400);
                }
            }

            // Determine data scope based on role and target_user_id
            $isTeamView = false;
            $targetUserId = null;
            
            if ($request->target_user_id && AccountingHelper::hasRole(['admin', 'manager'])) {
                // Admin/Manager viewing specific user
                $targetUserId = $request->target_user_id;
            } elseif (AccountingHelper::hasRole(['admin', 'manager'])) {
                // Admin/Manager viewing team overview
                $isTeamView = true;
            } else {
                // Telesales viewing own data
                $targetUserId = $user->user_id;
            }

            // Date ranges
            $today = now()->startOfDay();
            $weekStart = now()->startOfWeek();
            $monthStart = now()->startOfMonth();
            $customStart = $request->start_date ? \Carbon\Carbon::parse($request->start_date)->startOfDay() : null;
            $customEnd = $request->end_date ? \Carbon\Carbon::parse($request->end_date)->endOfDay() : null;

            // Base query for pool customers
            $poolQuery = MasterCustomer::where('cus_allocation_status', 'pool')
                ->where('cus_is_use', true);
            
            if (!$isTeamView) {
                $poolQuery->where('cus_created_by', $targetUserId);
            }
            
            $totalPool = $poolQuery->count();

            // Allocated customers queries
            $baseAllocatedQuery = MasterCustomer::where('cus_allocation_status', 'allocated')
                ->where('cus_is_use', true);
            
            if (!$isTeamView) {
                $baseAllocatedQuery->where('cus_allocated_by', $targetUserId);
            }

            // Today's allocations
            $allocatedToday = (clone $baseAllocatedQuery)
                ->whereDate('cus_allocated_at', '>=', $today)
                ->count();

            // This week's allocations
            $allocatedWeek = (clone $baseAllocatedQuery)
                ->whereDate('cus_allocated_at', '>=', $weekStart)
                ->count();

            // This month's allocations
            $allocatedMonth = (clone $baseAllocatedQuery)
                ->whereDate('cus_allocated_at', '>=', $monthStart)
                ->count();

            // By source distribution (use custom date range if provided)
            $sourceQuery = MasterCustomer::where('cus_is_use', true);
            
            if (!$isTeamView) {
                $sourceQuery->where('cus_created_by', $targetUserId);
            }
            
            if ($customStart && $customEnd) {
                $sourceQuery->whereBetween('cus_created_date', [$customStart, $customEnd]);
            }

            $bySource = $sourceQuery
                ->select('cus_source', DB::raw('COUNT(*) as count'))
                ->groupBy('cus_source')
                ->get()
                ->map(function ($item) {
                    return [
                        'source' => $item->cus_source ?? 'unknown',
                        'count' => $item->count
                    ];
                });

            // Recent allocations (last 5)
            $recentAllocationsQuery = MasterCustomer::where('cus_allocation_status', 'allocated')
                ->where('cus_is_use', true)
                ->with(['allocatedBy:user_id,username,user_firstname,user_lastname']);
            
            if (!$isTeamView) {
                $recentAllocationsQuery->where('cus_allocated_by', $targetUserId);
            }

            $recentAllocations = $recentAllocationsQuery
                ->orderBy('cus_allocated_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($customer) {
                    return [
                        'cus_id' => $customer->cus_id,
                        'cus_name' => $customer->cus_name ?? $customer->cus_company,
                        'cus_source' => $customer->cus_source,
                        'cus_allocated_at' => $customer->cus_allocated_at,
                        'allocated_by_name' => $customer->allocatedBy ? 
                            ($customer->allocatedBy->user_firstname . ' ' . $customer->allocatedBy->user_lastname) : null
                    ];
                });

            return response()->json([
                'status' => 'success',
                'data' => [
                    'total_pool' => $totalPool,
                    'total_allocated_today' => $allocatedToday,
                    'total_allocated_week' => $allocatedWeek,
                    'total_allocated_month' => $allocatedMonth,
                    'by_source' => $bySource,
                    'recent_allocations' => $recentAllocations
                ],
                'meta' => [
                    'user_role' => $user->role,
                    'is_team_view' => $isTeamView,
                    'target_user_id' => $targetUserId,
                    'date_range' => [
                        'start' => $customStart?->format('Y-m-d'),
                        'end' => $customEnd?->format('Y-m-d')
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Telesales dashboard error: ' . $e->getMessage(), [
                'user_id' => $user->user_id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }
}
