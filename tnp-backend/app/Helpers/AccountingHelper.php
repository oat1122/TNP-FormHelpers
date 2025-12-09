<?php

namespace App\Helpers;

use App\Constants\UserRole;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Class AccountingHelper
 * 
 * Utility helper methods for Accounting module
 * Provides common functionality used across accounting controllers
 */
class AccountingHelper
{
    /**
     * Get current authenticated user UUID
     * 
     * @return string|null
     */
    public static function getCurrentUserId(): ?string
    {
        return auth()->user()->user_uuid ?? null;
    }

    /**
     * Get current authenticated user information for access control
     * Extracts user_id, user_uuid, and role from authenticated user
     * 
     * @return array|null Array with user_id, user_uuid, role or null if not authenticated
     */
    public static function getCurrentUserInfo(): ?array
    {
        $user = auth()->user();
        
        if (!$user) {
            return null;
        }
        
        return [
            'user_id' => $user->user_id,
            'user_uuid' => $user->user_uuid,
            'role' => $user->role
        ];
    }

    /**
     * Get user information from request for access control
     * Used for API endpoints that receive user UUID in request
     * 
     * @param Request $request
     * @return array|null Array with user_id, user_uuid, role or null if user not found
     */
    public static function getUserInfoFromRequest(Request $request): ?array
    {
        if (!$request->has('user') || !$request->user) {
            return null;
        }

        $user = User::where('user_uuid', $request->user)
            ->where('user_is_enable', true)
            ->select('user_id', 'user_uuid', 'role')
            ->first();
        
        if (!$user) {
            return null;
        }
        
        return [
            'user_id' => $user->user_id,
            'user_uuid' => $user->user_uuid,
            'role' => $user->role
        ];
    }

    /**
     * Calculate VAT from total amount
     * 
     * @param float $amount Total amount including VAT
     * @param float $rate VAT rate (default: 0.07 = 7%)
     * @return array Array with total_amount, subtotal, vat_rate, vat_amount
     */
    public static function calculateVat(float $amount, float $rate = 0.07): array
    {
        $subtotal = $amount / (1 + $rate);
        $vatAmount = $amount - $subtotal;

        return [
            'total_amount' => round($amount, 2),
            'subtotal' => round($subtotal, 2),
            'vat_rate' => $rate,
            'vat_amount' => round($vatAmount, 2),
        ];
    }

    /**
     * Calculate subtotal and VAT from base amount
     * 
     * @param float $subtotal Subtotal amount (excluding VAT)
     * @param float $rate VAT rate (default: 0.07 = 7%)
     * @return array Array with subtotal, vat_rate, vat_amount, total_amount
     */
    public static function addVat(float $subtotal, float $rate = 0.07): array
    {
        $vatAmount = $subtotal * $rate;
        $totalAmount = $subtotal + $vatAmount;

        return [
            'subtotal' => round($subtotal, 2),
            'vat_rate' => $rate,
            'vat_amount' => round($vatAmount, 2),
            'total_amount' => round($totalAmount, 2),
        ];
    }

    /**
     * Format currency amount
     * 
     * @param float $amount Amount to format
     * @param string $currency Currency code (default: 'THB')
     * @param int $decimals Number of decimal places (default: 2)
     * @return string Formatted currency string
     */
    public static function formatCurrency(float $amount, string $currency = 'THB', int $decimals = 2): string
    {
        return number_format($amount, $decimals) . ' ' . $currency;
    }

    /**
     * Extract pagination metadata from Laravel paginator
     * 
     * @param mixed $paginator Laravel paginator instance
     * @return array Pagination metadata array
     */
    public static function getPaginationMetadata($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem()
        ];
    }

    /**
     * Sanitize and limit per_page parameter
     * 
     * @param int $perPage Requested per_page value
     * @param int $default Default value (default: 20)
     * @param int $max Maximum allowed value (default: 200)
     * @return int Sanitized per_page value
     */
    public static function sanitizePerPage(int $perPage, int $default = 20, int $max = 200): int
    {
        return min(max($perPage, 1), $max) ?: $default;
    }

    /**
     * Sanitize page parameter
     * 
     * @param int $page Requested page number
     * @return int Sanitized page number (minimum 1)
     */
    public static function sanitizePage(int $page): int
    {
        return max($page, 1);
    }

    /**
     * Check if current authenticated user has one of the specified roles
     * 
     * @param array $roles Array of role names to check
     * @return bool True if user has any of the specified roles
     */
    public static function hasRole(array $roles): bool
    {
        $user = auth()->user();
        
        if (!$user || !isset($user->role)) {
            return false;
        }
        
        return in_array($user->role, $roles, true);
    }

    /**
     * Check if current user can manage leads
     * Allowed roles: admin, manager, sale
     * 
     * @return bool True if user can manage leads
     */
    public static function canManageLeads(): bool
    {
        return self::hasRole([UserRole::ADMIN, UserRole::MANAGER, UserRole::SALE]);
    }

    /**
     * Check if current user can create customers
     * Allowed roles: admin, manager, sale, telesale
     * 
     * @return bool True if user can create customers
     */
    public static function canCreateCustomer(): bool
    {
        return self::hasRole([UserRole::ADMIN, UserRole::MANAGER, UserRole::SALE, UserRole::TELESALE]);
    }

    /**
     * Check if current user can allocate customers from pool
     * Allowed roles: admin, manager
     * 
     * @return bool True if user can allocate customers
     */
    public static function canAllocateCustomers(): bool
    {
        return self::hasRole([UserRole::ADMIN, UserRole::MANAGER]);
    }

    /**
     * Check if current user can view reports
     * Allowed roles: admin, manager
     * 
     * @return bool True if user can view reports
     */
    public static function canViewReports(): bool
    {
        return self::hasRole([UserRole::ADMIN, UserRole::MANAGER]);
    }

    /**
     * Check if current user can view all customers
     * Allowed roles: admin, manager
     * Regular sales and telesales can only see their assigned customers
     * 
     * @return bool True if user can view all customers
     */
    public static function canViewAllCustomers(): bool
    {
        return self::hasRole([UserRole::ADMIN, UserRole::MANAGER]);
    }

    /**
     * Check if current user is telesales
     * 
     * @return bool True if user is telesales
     */
    public static function isTelesales(): bool
    {
        return self::hasRole([UserRole::TELESALE]);
    }
}
