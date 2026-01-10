<?php

namespace App\Repositories;

use App\Repositories\NotificationRepositoryInterface;
use App\Models\CustomerNotificationRead;
use App\Models\MasterCustomer;
use Illuminate\Support\Collection;

/**
 * Notification Repository
 * 
 * จัดการ database operations ที่เกี่ยวกับ Notifications
 * รวมถึงการดึง, อ่าน, และซ่อน notifications
 */
class NotificationRepository implements NotificationRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function getNotificationsForUser(string $userId, int $days = 30, int $limit = 50): array
    {
        // Get read records for this user
        $readRecords = CustomerNotificationRead::where('user_id', $userId)
            ->get()
            ->keyBy('cus_id');
        
        // Get dismissed customer IDs
        $dismissedIds = $this->getDismissedIds($userId);
        
        // Get all customers allocated to this user
        $customers = MasterCustomer::where('cus_manage_by', $userId)
            ->where('cus_is_use', 1)
            ->whereNotIn('cus_id', $dismissedIds)
            ->where('cus_allocated_at', '>=', now()->subDays($days))
            ->orderBy('cus_allocated_at', 'desc')
            ->limit($limit)
            ->get([
                'cus_id',
                'cus_firstname',
                'cus_lastname',
                'cus_name',
                'cus_company',
                'cus_tel_1',
                'cus_source',
                'cus_allocated_at',
                'cus_created_date'
            ]);
        
        // Calculate unread count
        $unreadCount = $customers->filter(function ($customer) use ($readRecords) {
            return !isset($readRecords[$customer->cus_id]);
        })->count();
        
        return [
            'notifications' => $customers,
            'unread_count' => $unreadCount,
            'read_records' => $readRecords,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function getUnreadCount(string $userId, int $days = 30): int
    {
        $dismissedIds = $this->getDismissedIds($userId);
        $readIds = $this->getReadIds($userId);
        
        return MasterCustomer::where('cus_manage_by', $userId)
            ->where('cus_is_use', 1)
            ->whereNotIn('cus_id', array_merge($dismissedIds, $readIds))
            ->where('cus_allocated_at', '>=', now()->subDays($days))
            ->count();
    }

    /**
     * {@inheritDoc}
     */
    public function markAsRead(string $userId, array $customerIds): int
    {
        $markedCount = 0;
        
        foreach ($customerIds as $customerId) {
            CustomerNotificationRead::updateOrCreate(
                [
                    'cus_id' => $customerId,
                    'user_id' => $userId,
                ],
                [
                    'read_at' => now(),
                ]
            );
            $markedCount++;
        }
        
        return $markedCount;
    }

    /**
     * {@inheritDoc}
     */
    public function markAllAsRead(string $userId, int $days = 30): int
    {
        // Get all unread customer IDs for this user
        $unreadCustomerIds = MasterCustomer::where('cus_manage_by', $userId)
            ->where('cus_is_use', 1)
            ->whereNotExists(function ($query) use ($userId) {
                $query->select('id')
                    ->from('customer_notification_reads')
                    ->whereColumn('customer_notification_reads.cus_id', 'master_customers.cus_id')
                    ->where('customer_notification_reads.user_id', $userId);
            })
            ->where('cus_allocated_at', '>=', now()->subDays($days))
            ->pluck('cus_id');
        
        $markedCount = 0;
        $now = now();
        
        foreach ($unreadCustomerIds as $customerId) {
            CustomerNotificationRead::updateOrCreate(
                [
                    'cus_id' => $customerId,
                    'user_id' => $userId,
                ],
                [
                    'read_at' => $now,
                ]
            );
            $markedCount++;
        }
        
        return $markedCount;
    }

    /**
     * {@inheritDoc}
     */
    public function dismiss(string $userId, array $customerIds): int
    {
        $dismissedCount = 0;
        
        foreach ($customerIds as $customerId) {
            CustomerNotificationRead::updateOrCreate(
                [
                    'cus_id' => $customerId,
                    'user_id' => $userId,
                ],
                [
                    'read_at' => now(),
                    'is_dismissed' => true,
                ]
            );
            $dismissedCount++;
        }
        
        return $dismissedCount;
    }

    /**
     * {@inheritDoc}
     */
    public function getDismissedIds(string $userId): array
    {
        return CustomerNotificationRead::where('user_id', $userId)
            ->where('is_dismissed', true)
            ->pluck('cus_id')
            ->toArray();
    }

    /**
     * {@inheritDoc}
     */
    public function getReadIds(string $userId): array
    {
        return CustomerNotificationRead::where('user_id', $userId)
            ->where('is_dismissed', false)
            ->pluck('cus_id')
            ->toArray();
    }
}
