<?php

namespace App\Http\Resources\V1\Notebook;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotebookResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);

        if ($this->relationLoaded('histories')) {
            $data['histories'] = $this->histories
                ->map(fn ($history) => (new NotebookHistoryResource($history))->resolve($request))
                ->all();
        }

        return $data;
    }
}
