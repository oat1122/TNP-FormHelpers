<?php

namespace App\Constants;

/**
 * Customer Channel Constants
 * 
 * ใช้แทน Magic Numbers เพื่อความชัดเจน
 * แก้ไขที่เดียวมีผลทั้งระบบ
 */
class CustomerChannel
{
    // Channel Values
    public const SALES = 1;
    public const ONLINE = 2;
    public const OFFICE = 3;

    // Channel Labels (for display)
    public const LABELS = [
        self::SALES => 'Sales',
        self::ONLINE => 'Online',
        self::OFFICE => 'Office',
    ];

    // Visibility Rules (which roles see which channels)
    public const VISIBILITY = [
        'admin' => [self::SALES, self::ONLINE, self::OFFICE],
        'head_online' => [self::ONLINE, self::OFFICE],
        'head_offline' => [self::SALES, self::OFFICE],
    ];

    // Transfer Rules (from → to)
    public const TRANSFER_RULES = [
        'head_online' => ['from' => self::ONLINE, 'to' => self::SALES],
        'head_offline' => ['from' => self::SALES, 'to' => self::ONLINE],
    ];

    /**
     * Get label for channel
     */
    public static function getLabel(int $channel): string
    {
        return self::LABELS[$channel] ?? 'Unknown';
    }

    /**
     * Get visible channels for role
     */
    public static function getVisibleChannels(string $role): array
    {
        return self::VISIBILITY[$role] ?? [];
    }

    /**
     * Check if channel value is valid
     */
    public static function isValid(int $channel): bool
    {
        return in_array($channel, [self::SALES, self::ONLINE, self::OFFICE]);
    }

    /**
     * Get all valid channel values
     */
    public static function all(): array
    {
        return [self::SALES, self::ONLINE, self::OFFICE];
    }
}
