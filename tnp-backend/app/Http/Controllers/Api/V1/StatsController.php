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
     * Get personal dashboard stats for telesales
     * Shows today's performance
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function telesalesDashboard(Request $request)
    {
        $user = auth()->user();

        if (!$user || !AccountingHelper::isTelesales()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Only telesales can access this endpoint'
            ], 403);
        }

        try {
            $today = now()->format('Y-m-d');
            $thisMonth = now()->startOfMonth()->format('Y-m-d');

            // Today's stats
            $todayStats = MasterCustomer::where('cus_created_by', $user->user_id)
                ->whereDate('cus_created_date', $today)
                ->select(
                    DB::raw('COUNT(*) as total'),
                    DB::raw('SUM(CASE WHEN cus_allocation_status = "pool" THEN 1 ELSE 0 END) as in_pool'),
                    DB::raw('SUM(CASE WHEN cus_allocation_status = "allocated" THEN 1 ELSE 0 END) as allocated')
                )
                ->first();

            // This month's stats
            $monthStats = MasterCustomer::where('cus_created_by', $user->user_id)
                ->whereDate('cus_created_date', '>=', $thisMonth)
                ->select(
                    DB::raw('COUNT(*) as total'),
                    DB::raw('SUM(CASE WHEN cus_allocation_status = "pool" THEN 1 ELSE 0 END) as in_pool'),
                    DB::raw('SUM(CASE WHEN cus_allocation_status = "allocated" THEN 1 ELSE 0 END) as allocated')
                )
                ->first();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'user' => [
                        'user_id' => $user->user_id,
                        'username' => $user->username,
                        'name' => $user->user_firstname . ' ' . $user->user_lastname,
                    ],
                    'today' => [
                        'total_created' => $todayStats->total,
                        'in_pool' => $todayStats->in_pool,
                        'allocated' => $todayStats->allocated,
                    ],
                    'this_month' => [
                        'total_created' => $monthStats->total,
                        'in_pool' => $monthStats->in_pool,
                        'allocated' => $monthStats->allocated,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Telesales dashboard error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }
}
