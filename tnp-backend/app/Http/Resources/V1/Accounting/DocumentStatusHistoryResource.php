<?php

namespace App\Http\Resources\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentStatusHistoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'document_type' => $this->document_type,
            'document_id' => $this->document_id,
            'status' => $this->status,
            'status_label' => $this->getStatusLabel(),
            'notes' => $this->notes,
            'changed_by' => $this->changed_by,
            'changer' => new UserResource($this->whenLoaded('changedBy')),
            'changed_at' => $this->changed_at?->format('Y-m-d H:i:s'),
            'changed_at_formatted' => $this->changed_at?->diffForHumans(),
        ];
    }

    /**
     * Get status label for display
     */
    private function getStatusLabel(): string
    {
        $labels = [
            'draft' => 'ฉบับร่าง',
            'pending_review' => 'รอตรวจสอบ',
            'approved' => 'อนุมัติแล้ว',
            'rejected' => 'ไม่อนุมัติ',
            'completed' => 'เสร็จสิ้น',
            'paid' => 'ชำระแล้ว',
            'unpaid' => 'ยังไม่ชำระ',
            'partially_paid' => 'ชำระบางส่วน',
            'overdue' => 'เกินกำหนด'
        ];

        return $labels[$this->status] ?? $this->status;
    }
}
