<?php

namespace App\Http\Resources\V1\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\V1\CustomerResource;
use App\Http\Resources\V1\UserResource;

class QuotationResource extends JsonResource
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
            'quotation_no' => $this->quotation_no,
            'pricing_request_id' => $this->pricing_request_id,
            'customer_id' => $this->customer_id,
            'customer' => $this->whenLoaded('customer'),
            'pricing_request' => $this->whenLoaded('pricingRequest'),
            
            // Financial information
            'subtotal' => $this->subtotal,
            'tax_rate' => $this->tax_rate,
            'tax_amount' => $this->tax_amount,
            'total_amount' => $this->total_amount,
            'deposit_amount' => $this->deposit_amount,
            'remaining_amount' => $this->remaining_amount,
            
            // Terms and conditions
            'payment_terms' => $this->payment_terms,
            'valid_until' => $this->valid_until?->format('Y-m-d'),
            'remarks' => $this->remarks,
            
            // Status information
            'status' => $this->status,
            'status_label' => $this->getStatusLabel(),
            'status_color' => $this->getStatusColor(),
            'version_no' => $this->version_no,
            
            // Approval information
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->format('Y-m-d H:i:s'),
            'rejected_by' => $this->rejected_by,
            'rejected_at' => $this->rejected_at?->format('Y-m-d H:i:s'),
            'rejection_reason' => $this->rejection_reason,
            
            // Related data
            'items' => $this->whenLoaded('items'),
            'invoices' => $this->whenLoaded('invoices'),
            'attachments' => $this->whenLoaded('attachments'),
            'status_history' => $this->whenLoaded('statusHistory'),
            
            // User information
            'creator' => $this->whenLoaded('creator'),
            'approver' => $this->whenLoaded('approver'),
            'rejecter' => $this->whenLoaded('rejecter'),
            
            // Timestamps
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            
            // Computed properties
            'can_edit' => $this->canEdit(),
            'can_approve' => $this->canApprove(),
            'is_expired' => $this->valid_until ? $this->valid_until->isPast() : false,
            'days_until_expiry' => $this->valid_until ? max(0, now()->diffInDays($this->valid_until, false)) : null,
            
            // Actions available
            'available_actions' => $this->getAvailableActions(),
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
            'completed' => 'เสร็จสิ้น'
        ];

        return $labels[$this->status] ?? $this->status;
    }

    /**
     * Get status color for UI
     */
    private function getStatusColor(): string
    {
        $colors = config('accounting.status_colors', []);
        return $colors[$this->status] ?? '#6b7280';
    }

    /**
     * Get available actions based on current status and user permissions
     */
    private function getAvailableActions(): array
    {
        $actions = [];

        if ($this->canEdit()) {
            $actions[] = 'edit';
            $actions[] = 'delete';
        }

        if ($this->status === 'draft') {
            $actions[] = 'submit_for_review';
        }

        if ($this->canApprove()) {
            $actions[] = 'approve';
            $actions[] = 'reject';
        }

        if ($this->status === 'approved') {
            $actions[] = 'create_invoice';
            $actions[] = 'download_pdf';
        }

        $actions[] = 'view';
        $actions[] = 'view_history';

        return $actions;
    }
}
