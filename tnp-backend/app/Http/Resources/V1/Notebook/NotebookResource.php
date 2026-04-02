<?php

namespace App\Http\Resources\V1\Notebook;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotebookResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);

        unset($data['manage_by']);

        $data['nb_date'] = $this->nb_date?->toDateString();
        $data['manage_by_user'] = $this->relationLoaded('manageBy')
            ? $this->transformUserSummary($this->manageBy)
            : null;

        if ($this->relationLoaded('histories')) {
            $data['histories'] = $this->histories
                ->map(fn ($history) => (new NotebookHistoryResource($history))->resolve($request))
                ->all();
        }

        return $data;
    }

    protected function transformUserSummary(mixed $user): ?array
    {
        if (! $user) {
            return null;
        }

        return [
            'user_id' => $user->user_id,
            'username' => $user->username,
            'user_nickname' => $user->user_nickname,
            'user_firstname' => $user->user_firstname,
            'user_lastname' => $user->user_lastname,
            'role' => $user->role,
        ];
    }
}
