<?php

namespace App\Http\Resources\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_no' => $this->invoice_no,
            'quotation_id' => $this->quotation_id,
            'customer_id' => $this->customer_id,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'quotation' => new QuotationResource($this->whenLoaded('quotation')),
            
            // Dates
            'invoice_date' => $this->invoice_date?->format('Y-m-d'),
            'due_date' => $this->due_date?->format('Y-m-d'),
            'credit_term_days' => $this->credit_term_days,
            'reference_no' => $this->reference_no,
            
            // Financial information
            'subtotal' => $this->subtotal,
            'discount_percentage' => $this->discount_percentage,
            'discount_amount' => $this->discount_amount,
            'vat_rate' => $this->vat_rate,
            'vat_amount' => $this->vat_amount,
            'wht_rate' => $this->wht_rate,
            'wht_amount' => $this->wht_amount,
            'total_amount' => $this->total_amount,
            'paid_amount' => $this->paid_amount,
            'remaining_amount' => $this->remaining_amount,
            
            // Status information
            'status' => $this->status,
            'status_label' => $this->getStatusLabel(),
            'payment_status' => $this->payment_status,
            'payment_status_label' => $this->getPaymentStatusLabel(),
            'status_color' => $this->getStatusColor(),
            'version_no' => $this->version_no,
            
            // Notes and approval
            'notes' => $this->notes,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->format('Y-m-d H:i:s'),
            'rejected_reason' => $this->rejected_reason,
            
            // Related data
            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),
            'receipts' => ReceiptResource::collection($this->whenLoaded('receipts')),
            'attachments' => DocumentAttachmentResource::collection($this->whenLoaded('attachments')),
            'status_history' => DocumentStatusHistoryResource::collection($this->whenLoaded('statusHistory')),
            
            // User information
            'creator' => new UserResource($this->whenLoaded('createdBy')),
            'approver' => new UserResource($this->whenLoaded('approvedBy')),
            
            // Timestamps
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            
            // Computed properties
            'can_edit' => $this->canEdit(),
            'is_overdue' => $this->isOverdue(),
            'days_overdue' => $this->getDaysOverdue(),
            'days_until_due' => $this->getDaysUntilDue(),
            
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
     * Get payment status label for display
     */
    private function getPaymentStatusLabel(): string
    {
        $labels = [
            'unpaid' => 'ยังไม่ชำระ',
            'partially_paid' => 'ชำระบางส่วน',
            'paid' => 'ชำระแล้ว',
            'overdue' => 'เกินกำหนด'
        ];

        return $labels[$this->payment_status] ?? $this->payment_status;
    }

    /**
     * Get status color for UI
     */
    private function getStatusColor(): string
    {
        $colors = config('accounting.status_colors', []);
        return $colors[$this->payment_status] ?? $colors[$this->status] ?? '#6b7280';
    }

    /**
     * Get days overdue
     */
    private function getDaysOverdue(): ?int
    {
        if ($this->isOverdue()) {
            return now()->diffInDays($this->due_date);
        }
        return null;
    }

    /**
     * Get days until due
     */
    private function getDaysUntilDue(): ?int
    {
        if ($this->due_date && !$this->isOverdue()) {
            return now()->diffInDays($this->due_date, false);
        }
        return null;
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

        if ($this->status === 'pending_review') {
            $actions[] = 'approve';
            $actions[] = 'reject';
        }

        if ($this->status === 'approved') {
            $actions[] = 'create_receipt';
            $actions[] = 'download_pdf';
        }

        if ($this->payment_status !== 'paid') {
            $actions[] = 'record_payment';
        }

        $actions[] = 'view';
        $actions[] = 'view_history';

        return $actions;
    }
}
