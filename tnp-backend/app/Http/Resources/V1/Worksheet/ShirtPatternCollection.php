<?php

namespace App\Http\Resources\V1\Worksheet;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class ShirtPatternCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @return array<int|string, mixed>
     */
    public function toArray($request): array
    {
        $grouped = $this->collection->groupBy('pattern_name');

        return $grouped->map(function ($group) {
            return new ShirtPatternResource($group);
        })->values()->all();
    }
}
