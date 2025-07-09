<?php

namespace App\Enums\MaxSupply;

enum ProductionType: string
{
    case SCREEN = 'screen';
    case DTF = 'dtf';
    case SUBLIMATION = 'sublimation';

    /**
     * Get all production types as an array
     *
     * @return array
     */
    public static function toArray(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get production type display name
     *
     * @return string
     */
    public function getDisplayName(): string
    {
        return match($this) {
            self::SCREEN => 'Screen',
            self::DTF => 'DTF',
            self::SUBLIMATION => 'Sublimation',
        };
    }

    /**
     * Get base points for the production type
     *
     * @return int
     */
    public function getBasePoints(): int
    {
        return match($this) {
            self::SCREEN => 2,
            self::DTF => 1,
            self::SUBLIMATION => 3,
        };
    }
}
