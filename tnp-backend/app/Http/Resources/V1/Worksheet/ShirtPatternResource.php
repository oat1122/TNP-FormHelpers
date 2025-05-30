<?php

namespace App\Http\Resources\V1\Worksheet;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Services\WorksheetService;

class ShirtPatternResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $worksheetService = new WorksheetService;
        $pattern_id = $this->first()->pattern_id;
        $pattern_sizes_r = $worksheetService->filterShirtPatternByType($this->values()->toArray(), $pattern_id, null);

        return [
            'pattern_id' => $pattern_id,
            'pattern_name' => $this->first()->pattern_name,
            'pattern_type' => (string) $this->first()->pattern_type,
            'pattern_sizes' => $pattern_sizes_r,
        ];
    }
}
