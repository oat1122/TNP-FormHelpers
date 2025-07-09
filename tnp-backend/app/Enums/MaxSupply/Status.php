<?php

namespace App\Enums\MaxSupply;

enum Status: string
{
    case PENDING = 'pending';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    /**
     * Get all statuses as an array
     *
     * @return array
     */
    public static function toArray(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get status display name
     *
     * @return string
     */
    public function getDisplayName(): string
    {
        return match($this) {
            self::PENDING => 'รอดำเนินการ',
            self::IN_PROGRESS => 'กำลังดำเนินการ',
            self::COMPLETED => 'เสร็จสิ้น',
            self::CANCELLED => 'ยกเลิก',
        };
    }

    /**
     * Get status color
     *
     * @return string
     */
    public function getColor(): string
    {
        return match($this) {
            self::PENDING => 'warning',
            self::IN_PROGRESS => 'info',
            self::COMPLETED => 'success',
            self::CANCELLED => 'error',
        };
    }
}
