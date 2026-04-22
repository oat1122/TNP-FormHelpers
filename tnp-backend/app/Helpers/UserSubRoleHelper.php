<?php

namespace App\Helpers;

use App\Constants\UserRole;
use Illuminate\Support\Facades\Schema;

class UserSubRoleHelper
{
    public const HEAD_OFFLINE = 'HEAD_OFFLINE';

    public const SUPPORT_SALES = 'SUPPORT_SALES';

    public const SALES_OFFLINE = 'SALES_OFFLINE';

    public const TALESALES = 'TALESALES';

    public static function notebookQueueCodes(): array
    {
        return [
            self::SUPPORT_SALES,
            self::TALESALES,
        ];
    }

    public static function notebookQueueViewCodes(): array
    {
        return [
            self::SUPPORT_SALES,
            self::TALESALES,
            self::HEAD_OFFLINE,
        ];
    }

    public static function notebookQueueAssignCodes(): array
    {
        return [
            self::SUPPORT_SALES,
            self::HEAD_OFFLINE,
        ];
    }

    public static function notebookAllScopeCodes(): array
    {
        return [
            self::SUPPORT_SALES,
            self::HEAD_OFFLINE,
        ];
    }

    public static function canManageAllNotebooks($user): bool
    {
        return (bool) $user && in_array($user->role, [UserRole::ADMIN, UserRole::MANAGER], true);
    }

    public static function getSubRoleCodes($user): array
    {
        if (! $user) {
            return [];
        }

        $subRoles = $user->sub_roles ?? null;
        if (is_array($subRoles)) {
            return collect($subRoles)
                ->map(static fn ($subRole) => is_array($subRole) ? ($subRole['msr_code'] ?? null) : ($subRole->msr_code ?? null))
                ->filter()
                ->unique()
                ->values()
                ->all();
        }

        if (method_exists($user, 'relationLoaded') && $user->relationLoaded('subRoles')) {
            return $user->subRoles
                ->pluck('msr_code')
                ->filter()
                ->unique()
                ->values()
                ->all();
        }

        if (! Schema::hasTable('user_sub_roles') || ! Schema::hasTable('master_sub_roles')) {
            return [];
        }

        if (method_exists($user, 'loadMissing')) {
            $user->loadMissing('subRoles');

            if (method_exists($user, 'relationLoaded') && $user->relationLoaded('subRoles')) {
                return $user->subRoles
                    ->pluck('msr_code')
                    ->filter()
                    ->unique()
                    ->values()
                    ->all();
            }
        }

        if (method_exists($user, 'subRoles')) {
            return $user->subRoles()
                ->pluck('msr_code')
                ->filter()
                ->unique()
                ->values()
                ->all();
        }

        return [];
    }

    public static function hasAnySubRole($user, array $codes): bool
    {
        return collect(self::getSubRoleCodes($user))
            ->intersect($codes)
            ->isNotEmpty();
    }

    public static function isNotebookQueueUser($user): bool
    {
        return self::hasAnySubRole($user, self::notebookQueueCodes());
    }

    public static function isSupportSales($user): bool
    {
        return self::hasAnySubRole($user, [self::SUPPORT_SALES]);
    }

    public static function canViewNotebookQueue($user): bool
    {
        return self::canManageAllNotebooks($user)
            || self::hasAnySubRole($user, self::notebookQueueViewCodes())
            || ((bool) $user && $user->role === UserRole::SALE);
    }

    public static function canViewAllNotebookScope($user): bool
    {
        return self::canManageAllNotebooks($user)
            || self::hasAnySubRole($user, self::notebookAllScopeCodes());
    }

    public static function shouldCreateLeadIntoQueue($user, ?string $targetScope = null): bool
    {
        if ($targetScope === 'queue') {
            return self::isNotebookQueueUser($user);
        }

        if ($targetScope === 'mine') {
            return false;
        }

        return self::isNotebookQueueUser($user);
    }

    public static function shouldCreateLeadIntoMine($user, ?string $targetScope = null): bool
    {
        if ($targetScope === 'mine') {
            return (bool) $user && ($user->role === UserRole::SALE || self::isSupportSales($user));
        }

        if ($targetScope === 'queue') {
            return false;
        }

        return ! self::isNotebookQueueUser($user) && (bool) $user && $user->role === UserRole::SALE;
    }

    public static function canReserveNotebookQueue($user): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->role === UserRole::ADMIN) {
            return true;
        }

        return self::hasAnySubRole($user, self::notebookQueueAssignCodes());
    }

    public static function canAssignNotebookQueue($user): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->role === UserRole::ADMIN) {
            return true;
        }

        return self::hasAnySubRole($user, self::notebookQueueAssignCodes());
    }

    public static function canExportNotebookSelfReport($user): bool
    {
        return self::isNotebookQueueUser($user)
            || ((bool) $user && $user->role === UserRole::SALE);
    }
}
