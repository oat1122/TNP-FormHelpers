<?php

namespace App\Http\Resources\MaxSupply;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CalendarResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        // This resource handles different types of calendar data (monthly, weekly, daily)
        return $this->resource;
    }
}
