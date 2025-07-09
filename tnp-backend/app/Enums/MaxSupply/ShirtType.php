<?php

namespace App\Enums\MaxSupply;

enum ShirtType: string
{
    case POLO = 'polo';
    case T_SHIRT = 't-shirt';
    case HOODIE = 'hoodie';
    case TANK_TOP = 'tank-top';

    /**
     * Get all shirt types as an array
     *
     * @return array
     */
    public static function toArray(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get shirt type display name
     *
     * @return string
     */
    public function getDisplayName(): string
    {
        return match($this) {
            self::POLO => 'เสื้อโปโล',
            self::T_SHIRT => 'เสื้อยืด',
            self::HOODIE => 'เสื้อฮู้ด',
            self::TANK_TOP => 'เสื้อกล้าม',
        };
    }
}
