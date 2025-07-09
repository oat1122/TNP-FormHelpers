<?php

namespace App\Enums\MaxSupply;

enum Priority: string
{
    case LOW = 'low';
    case NORMAL = 'normal';
    case HIGH = 'high';
    case URGENT = 'urgent';

    /**
     * Get all priorities as an array
     *
     * @return array
     */
    public static function toArray(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get priority display name
     *
     * @return string
     */
    public function getDisplayName(): string
    {
        return match($this) {
            self::LOW => 'ต่ำ',
            self::NORMAL => 'ปกติ',
            self::HIGH => 'สูง',
            self::URGENT => 'ด่วน',
        };
    }

    /**
     * Get priority color
     *
     * @return string
     */
    public function getColor(): string
    {
        return match($this) {
            self::LOW => 'success',
            self::NORMAL => 'info',
            self::HIGH => 'warning',
            self::URGENT => 'error',
        };
    }
}
