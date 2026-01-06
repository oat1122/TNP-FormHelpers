<?php

namespace App\Http\Controllers\Api\V1;

use App\Repositories\NotificationRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * NotificationController
 * 
 * จัดการการแจ้งเตือนลูกค้าที่ถูกจัดสรรให้ Sales
 * Database operations ถูกย้ายไปที่ NotificationRepository
 */
class NotificationController extends Controller
{
    protected NotificationRepositoryInterface $notificationRepository;
    protected NotificationService $notificationService;

    public function __construct(
        NotificationRepositoryInterface $notificationRepository,
        NotificationService $notificationService
    ) {
        $this->notificationRepository = $notificationRepository;
        $this->notificationService = $notificationService;
    }

    /**
     * Get notifications for the authenticated user
     * Returns both read and unread notifications (excludes dismissed)
     * 
     * @return JsonResponse
     */
    public function getUnreadNotifications(): JsonResponse
    {
        try {
            $user = Auth::user();
            $userId = $user->user_id;
            
            // Debug: Log the query parameters
            Log::info('NotificationController::getUnreadNotifications', [
                'user_id' => $userId,
                'user_role' => $user->role,
                'checking_30_days_from' => now()->subDays(30)->toDateTimeString()
            ]);
            
            // Get notifications from repository
            $result = $this->notificationRepository->getNotificationsForUser($userId);
            $customers = $result['notifications'];
            $readRecords = $result['read_records'];
            
            // Debug: Log the results
            Log::info('NotificationController::getUnreadNotifications - Results', [
                'count' => $customers->count(),
                'customer_ids' => $customers->pluck('cus_id')->toArray()
            ]);
            
            // Transform to notification format with is_read flag
            $notifications = $customers->map(function ($customer) use ($readRecords) {
                $customerName = trim(($customer->cus_firstname ?? '') . ' ' . ($customer->cus_lastname ?? '')) ?: $customer->cus_name;
                $companyName = $customer->cus_company;
                
                $message = $customerName;
                if ($companyName) {
                    $message .= " - {$companyName}";
                }
                if ($customer->cus_tel_1) {
                    $message .= " ({$customer->cus_tel_1})";
                }
                
                // Check if this notification has been read
                $isRead = isset($readRecords[$customer->cus_id]);
                
                return [
                    'id' => $customer->cus_id,
                    'cus_id' => $customer->cus_id,
                    'title' => 'ลูกค้าใหม่ที่ได้รับมอบหมาย',
                    'message' => $message,
                    'timestamp' => $customer->cus_allocated_at ?? $customer->cus_created_date,
                    'is_read' => $isRead,
                    'type' => 'customer_allocation',
                    'data' => [
                        'customer_id' => $customer->cus_id,
                        'customer_name' => $customerName,
                        'company_name' => $companyName,
                        'phone' => $customer->cus_tel_1,
                        'source' => $customer->cus_source,
                    ]
                ];
            });
            
            // Count unread notifications
            $unreadCount = $notifications->filter(fn($n) => !$n['is_read'])->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'unread_count' => $unreadCount,
                    'notifications' => $notifications->values()
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('NotificationController::getUnreadNotifications', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    
    /**
     * Mark specific notifications as read
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function markAsRead(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'customer_ids' => 'required|array|min:1',
                'customer_ids.*' => 'required|string|uuid'
            ]);
            
            $user = Auth::user();
            $userId = $user->user_id;
            $customerIds = $request->input('customer_ids');
            
            // Use repository to mark as read
            $markedCount = $this->notificationRepository->markAsRead($userId, $customerIds);
            
            // Sync unread count to frontend via Fastify
            $unreadCount = $this->notificationRepository->getUnreadCount($userId);
            $this->notificationService->syncNotificationCount($userId, $unreadCount);
            
            return response()->json([
                'success' => true,
                'message' => "Marked {$markedCount} notifications as read",
                'data' => [
                    'marked_count' => $markedCount
                ]
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('NotificationController::markAsRead', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notifications as read',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    
    /**
     * Mark all notifications as read for the authenticated user
     * 
     * @return JsonResponse
     */
    public function markAllAsRead(): JsonResponse
    {
        try {
            $user = Auth::user();
            $userId = $user->user_id;
            
            // Use repository to mark all as read
            $markedCount = $this->notificationRepository->markAllAsRead($userId);
            
            // Sync unread count to frontend via Fastify (should be 0 after mark all)
            $this->notificationService->syncNotificationCount($userId, 0);
            
            return response()->json([
                'success' => true,
                'message' => "Marked all {$markedCount} notifications as read",
                'data' => [
                    'marked_count' => $markedCount
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('NotificationController::markAllAsRead', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all notifications as read',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    
    /**
     * Dismiss specific notifications (hide permanently)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function dismiss(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'customer_ids' => 'required|array|min:1',
                'customer_ids.*' => 'required|string|uuid'
            ]);
            
            $user = Auth::user();
            $userId = $user->user_id;
            $customerIds = $request->input('customer_ids');
            
            // Use repository to dismiss
            $dismissedCount = $this->notificationRepository->dismiss($userId, $customerIds);
            
            // Sync unread count to frontend via Fastify
            $unreadCount = $this->notificationRepository->getUnreadCount($userId);
            $this->notificationService->syncNotificationCount($userId, $unreadCount);
            
            return response()->json([
                'success' => true,
                'message' => "Dismissed {$dismissedCount} notifications",
                'data' => [
                    'dismissed_count' => $dismissedCount
                ]
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('NotificationController::dismiss', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to dismiss notifications',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
