<?php

namespace App\Http\Resources\V1\Notebook;

use App\Models\User\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotebookHistoryResource extends JsonResource
{
    protected static array $userDisplayCache = [];

    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);

        $data['display_old_values'] = $this->buildDisplayValues($data['old_values'] ?? null);
        $data['display_new_values'] = $this->buildDisplayValues($data['new_values'] ?? null);

        if ($this->relationLoaded('actionBy')) {
            $data['action_by'] = $this->actionBy?->toArray();
        }

        return $data;
    }

    protected function buildDisplayValues(?array $values): ?array
    {
        if (! is_array($values)) {
            return $values;
        }

        $displayValues = $values;

        if (array_key_exists('nb_manage_by', $displayValues)) {
            $displayValues['nb_manage_by'] = $this->resolveUserDisplayName($displayValues['nb_manage_by']);
        }

        return $displayValues;
    }

    protected function resolveUserDisplayName(mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return $value;
        }

        if (! is_numeric($value)) {
            return $value;
        }

        $userId = (int) $value;

        if ($userId <= 0) {
            return $value;
        }

        if (! array_key_exists($userId, self::$userDisplayCache)) {
            $user = User::query()
                ->select(['user_id', 'username', 'user_nickname', 'user_firstname', 'user_lastname'])
                ->find($userId);

            self::$userDisplayCache[$userId] = $user?->username
                ?? $user?->user_nickname
                ?? trim(($user?->user_firstname ?? '').' '.($user?->user_lastname ?? ''))
                ?: (string) $value;
        }

        return self::$userDisplayCache[$userId];
    }
}
