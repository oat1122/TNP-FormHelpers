<?php

namespace App\Repositories;

use Illuminate\Support\Collection;

/**
 * Notification Repository Interface
 * 
 * Contract สำหรับ database operations ที่เกี่ยวกับ Notifications
 */
interface NotificationRepositoryInterface
{
    /**
     * Get notifications for a user (excludes dismissed)
     * 
     * @param string $userId
     * @param int $days Number of days to look back (default 30)
     * @param int $limit Maximum notifications to return
     * @return array{notifications: Collection, unread_count: int, read_ids: array}
     */
    public function getNotificationsForUser(string $userId, int $days = 30, int $limit = 50): array;

    /**
     * Get unread notification count for a user
     * 
     * @param string $userId
     * @param int $days Number of days to look back
     * @return int
     */
    public function getUnreadCount(string $userId, int $days = 30): int;

    /**
     * Mark specific notifications as read
     * 
     * @param string $userId
     * @param array $customerIds
     * @return int Number of marked notifications
     */
    public function markAsRead(string $userId, array $customerIds): int;

    /**
     * Mark all notifications as read for a user
     * 
     * @param string $userId
     * @param int $days Number of days to look back
     * @return int Number of marked notifications
     */
    public function markAllAsRead(string $userId, int $days = 30): int;

    /**
     * Dismiss (hide) specific notifications
     * 
     * @param string $userId
     * @param array $customerIds
     * @return int Number of dismissed notifications
     */
    public function dismiss(string $userId, array $customerIds): int;

    /**
     * Get dismissed notification IDs for a user
     * 
     * @param string $userId
     * @return array
     */
    public function getDismissedIds(string $userId): array;

    /**
     * Get read notification IDs for a user (excluding dismissed)
     * 
     * @param string $userId
     * @return array
     */
    public function getReadIds(string $userId): array;
}
