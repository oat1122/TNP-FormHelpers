<?php

namespace App\Http\Resources\MaxSupply;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaxSupplyResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'worksheet_id' => $this->worksheet_id,
            'screen_id' => $this->screen_id,
            'title' => $this->title,
            'customer_name' => $this->customer_name,
            'production_type' => $this->production_type,
            'start_date' => $this->start_date->format('Y-m-d'),
            'expected_completion_date' => $this->expected_completion_date->format('Y-m-d'),
            'due_date' => $this->due_date->format('Y-m-d'),
            'actual_completion_date' => $this->actual_completion_date ? $this->actual_completion_date->format('Y-m-d') : null,
            'status' => $this->status,
            'priority' => $this->priority,
            'shirt_type' => $this->shirt_type,
            'total_quantity' => $this->total_quantity,
            'completed_quantity' => $this->completed_quantity,
            'progress_percentage' => $this->progress_percentage,
            'is_overdue' => $this->is_overdue,
            'sizes' => $this->sizes,
            'screen_points' => $this->screen_points,
            'dtf_points' => $this->dtf_points,
            'sublimation_points' => $this->sublimation_points,
            'notes' => $this->notes,
            'special_instructions' => $this->special_instructions,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
            
            // Relations
            'worksheet' => $this->whenLoaded('worksheet', function () {
                return [
                    'worksheet_id' => $this->worksheet->worksheet_id,
                    'work_id' => $this->worksheet->work_id,
                    'work_name' => $this->worksheet->work_name,
                    'total_quantity' => $this->worksheet->total_quantity,
                ];
            }),
            
            'screen' => $this->whenLoaded('screen', function () {
                return [
                    'screen_id' => $this->screen->screen_id,
                    'screen_detail' => $this->screen->screen_detail,
                    'screen_point' => $this->screen->screen_point,
                    'screen_dft' => $this->screen->screen_dft,
                    'screen_flex' => $this->screen->screen_flex,
                    'screen_label' => $this->screen->screen_label,
                    'screen_embroider' => $this->screen->screen_embroider,
                ];
            }),
            
            'creator' => $this->whenLoaded('creator', function () {
                return [
                    'id' => $this->creator->id,
                    'name' => $this->creator->name,
                ];
            }),
            
            'activities' => ActivityLogResource::collection($this->whenLoaded('activities')),
        ];
    }
}
