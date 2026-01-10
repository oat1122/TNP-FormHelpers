<?php

namespace App\Constants;

/**
 * User Role Constants
 * 
 * Centralized role definitions to avoid hard-coded strings
 * throughout the application.
 */
class UserRole
{
    const ADMIN = 'admin';
    const MANAGER = 'manager';
    const SALE = 'sale';
    const TELESALE = 'telesale';
    const PRODUCTION = 'production';
    const GRAPHIC = 'graphic';
    const TECHNICIAN = 'technician';

    /**
     * Get all available roles
     * 
     * @return array
     */
    public static function all(): array
    {
        return [
            self::ADMIN,
            self::MANAGER,
            self::SALE,
            self::TELESALE,
            self::PRODUCTION,
            self::GRAPHIC,
            self::TECHNICIAN,
        ];
    }

    /**
     * Get roles that can manage customers
     * 
     * @return array
     */
    public static function canManageCustomers(): array
    {
        return [
            self::ADMIN,
            self::MANAGER,
            self::SALE,
            self::TELESALE,
        ];
    }

    /**
     * Get roles that can allocate customers
     * 
     * @return array
     */
    public static function canAllocate(): array
    {
        return [
            self::ADMIN,
            self::MANAGER,
        ];
    }

    /**
     * Get roles that can view reports
     * 
     * @return array
     */
    public static function canViewReports(): array
    {
        return [
            self::ADMIN,
            self::MANAGER,
        ];
    }

    /**
     * Check if role is valid
     * 
     * @param string $role
     * @return bool
     */
    public static function isValid(string $role): bool
    {
        return in_array($role, self::all(), true);
    }
}
