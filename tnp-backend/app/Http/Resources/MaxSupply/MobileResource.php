<?php

namespace App\Http\Resources\MaxSupply;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MobileResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        // Optimized for mobile consumption - smaller payload
        return [
            'id' => $this->id,
            'code' => $this->code,
            'title' => $this->title,
            'customer_name' => $this->customer_name,
            'production_type' => $this->production_type,
            'start_date' => $this->start_date->format('Y-m-d'),
            'due_date' => $this->due_date->format('Y-m-d'),
            'status' => $this->status,
            'priority' => $this->priority,
            'shirt_type' => $this->shirt_type,
            'total_quantity' => $this->total_quantity,
            'completed_quantity' => $this->completed_quantity,
            'progress_percentage' => $this->progress_percentage,
            'is_overdue' => $this->is_overdue,
        ];
    }
}
