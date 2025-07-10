<?php

namespace App\Http\Resources\V1\MaxSupply;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaxSupplyResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'worksheet_id' => $this->worksheet_id,
            'worksheet' => $this->whenLoaded('worksheet', function () {
                return [
                    'worksheet_id' => $this->worksheet->worksheet_id,
                    'work_id' => $this->worksheet->work_id,
                    'work_name' => $this->worksheet->work_name,
                    'customer_name' => $this->worksheet->customer->cus_name ?? null,
                    'due_date' => $this->worksheet->due_date,
                ];
            }),
            'title' => $this->title,
            'customer_name' => $this->customer_name,
            'production_type' => $this->production_type,
            'production_type_label' => $this->getProductionTypeLabel(),
            'start_date' => $this->start_date->format('Y-m-d'),
            'expected_completion_date' => $this->expected_completion_date->format('Y-m-d'),
            'due_date' => $this->due_date->format('Y-m-d'),
            'actual_completion_date' => $this->actual_completion_date?->format('Y-m-d'),
            'status' => $this->status,
            'status_label' => $this->getStatusLabel(),
            'priority' => $this->priority,
            'priority_label' => $this->getPriorityLabel(),
            'shirt_type' => $this->shirt_type,
            'shirt_type_label' => $this->getShirtTypeLabel(),
            'total_quantity' => $this->total_quantity,
            'completed_quantity' => $this->completed_quantity,
            'progress_percentage' => $this->progress_percentage,
            'sizes' => $this->sizes,
            'screen_points' => $this->screen_points,
            'dtf_points' => $this->dtf_points,
            'sublimation_points' => $this->sublimation_points,
            'notes' => $this->notes,
            'special_instructions' => $this->special_instructions,
            'is_overdue' => $this->is_overdue,
            'duration_days' => $this->duration_days,
            'remaining_days' => $this->remaining_days,
            'creator' => $this->whenLoaded('creator', function () {
                return [
                    'user_id' => $this->creator->user_id,
                    'username' => $this->creator->username,
                    'nickname' => $this->creator->user_nickname,
                ];
            }),
            'updater' => $this->whenLoaded('updater', function () {
                return [
                    'user_id' => $this->updater->user_id,
                    'username' => $this->updater->username,
                    'nickname' => $this->updater->user_nickname,
                ];
            }),
            'activities' => $this->whenLoaded('activities', function () {
                return $this->activities->map(function ($activity) {
                    return [
                        'id' => $activity->id,
                        'action' => $activity->action,
                        'description' => $activity->description,
                        'user' => $activity->user->user_nickname ?? $activity->user->username,
                        'created_at' => $activity->created_at->format('Y-m-d H:i:s'),
                    ];
                });
            }),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get production type label
     */
    private function getProductionTypeLabel(): string
    {
        return match($this->production_type) {
            'screen' => 'สกรีน',
            'dtf' => 'DTF',
            'sublimation' => 'ซับลิเมชัน',
            default => $this->production_type
        };
    }

    /**
     * Get status label
     */
    private function getStatusLabel(): string
    {
        return match($this->status) {
            'pending' => 'รอดำเนินการ',
            'in_progress' => 'กำลังดำเนินการ',
            'completed' => 'เสร็จสิ้น',
            'cancelled' => 'ยกเลิก',
            default => $this->status
        };
    }

    /**
     * Get priority label
     */
    private function getPriorityLabel(): string
    {
        return match($this->priority) {
            'low' => 'ต่ำ',
            'normal' => 'ปกติ',
            'high' => 'สูง',
            'urgent' => 'เร่งด่วน',
            default => $this->priority
        };
    }

    /**
     * Get shirt type label
     */
    private function getShirtTypeLabel(): string
    {
        return match($this->shirt_type) {
            'polo' => 'เสื้อโปโล',
            't-shirt' => 'เสื้อยืด',
            'hoodie' => 'เสื้อฮู้ด',
            'tank-top' => 'เสื้อกล้าม',
            default => $this->shirt_type
        };
    }
}
