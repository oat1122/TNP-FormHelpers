<?php

namespace App\Http\Resources\V1\Notebook;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotebookHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);

        if ($this->relationLoaded('actionBy')) {
            $data['action_by'] = $this->actionBy?->toArray();
        }

        return $data;
    }
}
