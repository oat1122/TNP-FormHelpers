<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Helpers\AccountingHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    /**
     * Check unread notifications count for current user
     * 
     * For Phase 2.1: Simple implementation counting newly allocated customers
     * In future phases, this can be expanded to use a proper notifications table
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkUnread(Request $request)
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 401);
        }

        // Only sales can receive allocation notifications
        if (!AccountingHelper::hasRole(['sale'])) {
            return response()->json([
                'status' => 'success',
                'unread_count' => 0,
                'notifications' => []
            ]);
        }

        // Count unread notifications (allocated customers not marked as read)
        $unreadCount = DB::table('master_customers')
            ->where('cus_manage_by', $user->user_id)
            ->where('cus_allocation_status', 'allocated')
            ->whereNotNull('cus_allocated_at')
            ->where('cus_allocated_at', '>=', now()->subDay())
            ->whereNotExists(function ($query) use ($user) {
                $query->select(DB::raw(1))
                    ->from('customer_notification_reads')
                    ->whereColumn('customer_notification_reads.cus_id', 'master_customers.cus_id')
                    ->where('customer_notification_reads.user_id', $user->user_id);
            })
            ->count();

        // Get recent allocations details
        $recentAllocations = DB::table('master_customers')
            ->select(
                'cus_id',
                'cus_name',
                'cus_company',
                'cus_allocated_at',
                'cus_allocated_by'
            )
            ->where('cus_manage_by', $user->user_id)
            ->where('cus_allocation_status', 'allocated')
            ->whereNotNull('cus_allocated_at')
            ->where('cus_allocated_at', '>=', now()->subDay())
            ->orderBy('cus_allocated_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'status' => 'success',
            'unread_count' => $unreadCount,
            'notifications' => $recentAllocations->map(function ($item) {
                return [
                    'id' => $item->cus_id,
                    'type' => 'customer_allocated',
                    'title' => 'มีลูกค้าใหม่ที่ได้รับมอบหมาย',
                    'message' => "ลูกค้า: {$item->cus_name} ({$item->cus_company})",
                    'timestamp' => $item->cus_allocated_at,
                    'data' => [
                        'customer_id' => $item->cus_id,
                        'customer_name' => $item->cus_name,
                        'company' => $item->cus_company,
                        'allocated_by' => $item->cus_allocated_by
                    ]
                ];
            })
        ]);
    }

    /**
     * Get all notifications for current user
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 401);
        }

        // Get allocations from the last 7 days
        $notifications = DB::table('master_customers')
            ->select(
                'cus_id',
                'cus_name',
                'cus_company',
                'cus_allocated_at',
                'cus_allocated_by'
            )
            ->where('cus_manage_by', $user->user_id)
            ->where('cus_allocation_status', 'allocated')
            ->whereNotNull('cus_allocated_at')
            ->where('cus_allocated_at', '>=', now()->subDays(7))
            ->orderBy('cus_allocated_at', 'desc')
            ->get();

        // Check which notifications have been read by this user
        $readNotifications = DB::table('customer_notification_reads')
            ->where('user_id', $user->user_id)
            ->pluck('cus_id')
            ->toArray();

        return response()->json([
            'status' => 'success',
            'total' => $notifications->count(),
            'notifications' => $notifications->map(function ($item) use ($readNotifications) {
                return [
                    'id' => $item->cus_id,
                    'type' => 'customer_allocated',
                    'title' => 'มีลูกค้าใหม่ที่ได้รับมอบหมาย',
                    'message' => "ลูกค้า: {$item->cus_name} ({$item->cus_company})",
                    'timestamp' => $item->cus_allocated_at,
                    'read' => in_array($item->cus_id, $readNotifications),
                    'data' => [
                        'customer_id' => $item->cus_id,
                        'customer_name' => $item->cus_name,
                        'company' => $item->cus_company,
                        'allocated_by' => $item->cus_allocated_by
                    ]
                ];
            })
        ]);
    }

    /**
     * Mark notification(s) as read
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAsRead(Request $request)
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 401);
        }

        $request->validate([
            'customer_ids' => 'required|array',
            'customer_ids.*' => 'required|uuid|exists:master_customers,cus_id'
        ]);

        try {
            $customerIds = $request->customer_ids;
            $userId = $user->user_id;
            $now = now();

            // Insert or update read status for each customer
            foreach ($customerIds as $cusId) {
                DB::table('customer_notification_reads')
                    ->updateOrInsert(
                        [
                            'cus_id' => $cusId,
                            'user_id' => $userId
                        ],
                        [
                            'read_at' => $now,
                            'updated_at' => $now
                        ]
                    );
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Notifications marked as read',
                'count' => count($customerIds)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to mark notifications as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark all notifications as read for current user
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAllAsRead(Request $request)
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 401);
        }

        try {
            // Get all unread customer allocations
            $unreadCustomers = DB::table('master_customers')
                ->select('cus_id')
                ->where('cus_manage_by', $user->user_id)
                ->where('cus_allocation_status', 'allocated')
                ->whereNotNull('cus_allocated_at')
                ->where('cus_allocated_at', '>=', now()->subDays(7))
                ->whereNotExists(function ($query) use ($user) {
                    $query->select(DB::raw(1))
                        ->from('customer_notification_reads')
                        ->whereColumn('customer_notification_reads.cus_id', 'master_customers.cus_id')
                        ->where('customer_notification_reads.user_id', $user->user_id);
                })
                ->pluck('cus_id');

            $now = now();
            foreach ($unreadCustomers as $cusId) {
                DB::table('customer_notification_reads')
                    ->updateOrInsert(
                        [
                            'cus_id' => $cusId,
                            'user_id' => $user->user_id
                        ],
                        [
                            'read_at' => $now,
                            'updated_at' => $now
                        ]
                    );
            }

            return response()->json([
                'status' => 'success',
                'message' => 'All notifications marked as read',
                'count' => $unreadCustomers->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to mark all notifications as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
