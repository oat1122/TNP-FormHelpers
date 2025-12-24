<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Notification Service
 * 
 * ส่ง real-time notifications ไปยัง Fastify Notification Server
 * เพื่อแจ้งเตือน users ผ่าน Socket.io
 */
class NotificationService
{
    protected string $baseUrl;
    protected ?string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.notification.url', 'http://localhost:3000');
        $this->apiKey = config('services.notification.api_key');
    }

    /**
     * Send notification to a specific user
     *
     * @param int $userId User ID to notify
     * @param string $title Notification title
     * @param string $message Notification message
     * @param string $type Notification type: info, success, warning, error
     * @return bool
     */
    public function notify(int $userId, string $title, string $message, string $type = 'info'): bool
    {
        try {
            $headers = ['Content-Type' => 'application/json'];
            
            // Add API key header if configured (for production)
            if ($this->apiKey) {
                $headers['X-API-Key'] = $this->apiKey;
            }

            $response = Http::withHeaders($headers)
                ->timeout(5)
                ->post("{$this->baseUrl}/notify", [
                    'user_id' => (string) $userId,
                    'title' => $title,
                    'message' => $message,
                    'type' => $type,
                ]);

            if ($response->successful()) {
                Log::info("Notification sent to user {$userId}: {$title}");
                return true;
            }

            Log::warning("Notification failed for user {$userId}: " . $response->body());
            return false;

        } catch (\Exception $e) {
            Log::warning("Notification service error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Notify sales user about new customer allocation
     *
     * @param int $salesUserId Sales user ID
     * @param string $customerName Customer name
     * @param string|null $allocatorName Name of person who allocated
     * @return bool
     */
    public function notifyCustomerAllocated(int $salesUserId, string $customerName, ?string $allocatorName = null): bool
    {
        $message = $allocatorName 
            ? "คุณได้รับลูกค้า: {$customerName} จาก {$allocatorName}"
            : "คุณได้รับลูกค้า: {$customerName}";

        return $this->notify(
            $salesUserId,
            '🎉 ลูกค้าใหม่!',
            $message,
            'success'
        );
    }

    /**
     * Notify user about customer transfer
     *
     * @param int $userId User to notify
     * @param string $customerName Customer name
     * @param string $fromChannel Source channel name
     * @param string $toChannel Target channel name
     * @return bool
     */
    public function notifyCustomerTransferred(int $userId, string $customerName, string $fromChannel, string $toChannel): bool
    {
        return $this->notify(
            $userId,
            '🔄 ลูกค้าถูกโอน',
            "ลูกค้า {$customerName} ถูกโอนจาก {$fromChannel} ไป {$toChannel}",
            'info'
        );
    }

    /**
     * Notify multiple users at once
     *
     * @param array $userIds Array of user IDs
     * @param string $title Notification title
     * @param string $message Notification message
     * @param string $type Notification type
     * @return int Number of successful notifications
     */
    public function notifyMany(array $userIds, string $title, string $message, string $type = 'info'): int
    {
        $successCount = 0;
        
        foreach ($userIds as $userId) {
            if ($this->notify($userId, $title, $message, $type)) {
                $successCount++;
            }
        }
        
        return $successCount;
    }
}
