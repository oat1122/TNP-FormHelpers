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

        // Count customers allocated to this user in the last 24 hours
        // In a real system, this would check a notifications table with read/unread status
        $unreadCount = DB::table('master_customers')
            ->where('cus_manage_by', $user->user_id)
            ->where('cus_allocation_status', 'allocated')
            ->whereNotNull('cus_allocated_at')
            ->where('cus_allocated_at', '>=', now()->subDay())
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

        return response()->json([
            'status' => 'success',
            'total' => $notifications->count(),
            'notifications' => $notifications->map(function ($item) {
                return [
                    'id' => $item->cus_id,
                    'type' => 'customer_allocated',
                    'title' => 'มีลูกค้าใหม่ที่ได้รับมอบหมาย',
                    'message' => "ลูกค้า: {$item->cus_name} ({$item->cus_company})",
                    'timestamp' => $item->cus_allocated_at,
                    'read' => false, // In future, check against notifications table
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
}
