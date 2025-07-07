<?php

namespace App\Http\Resources\MaxSupply;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaxSupplyResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'worksheet_id' => $this->worksheet_id,
            'title' => $this->title,
            'status' => $this->status,
            'due_date' => $this->due_date,
        ];
    }
}
