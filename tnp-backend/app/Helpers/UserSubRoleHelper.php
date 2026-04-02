<?php

namespace App\Helpers;

use App\Constants\UserRole;
use Illuminate\Support\Facades\Schema;

class UserSubRoleHelper
{
    public const SUPPORT_SALES = 'SUPPORT_SALES';

    public const TALESALES = 'TALESALES';

    public static function notebookQueueCodes(): array
    {
        return [
            self::SUPPORT_SALES,
            self::TALESALES,
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

    public static function shouldCreateLeadIntoQueue($user): bool
    {
        return self::isNotebookQueueUser($user);
    }

    public static function shouldCreateLeadIntoMine($user): bool
    {
        return ! self::isNotebookQueueUser($user) && (bool) $user && $user->role === UserRole::SALE;
    }

    public static function canReserveNotebookQueue($user): bool
    {
        return self::canManageAllNotebooks($user)
            || self::isNotebookQueueUser($user)
            || ((bool) $user && $user->role === UserRole::SALE);
    }

    public static function canExportNotebookSelfReport($user): bool
    {
        return self::isNotebookQueueUser($user)
            || ((bool) $user && $user->role === UserRole::SALE);
    }
}
