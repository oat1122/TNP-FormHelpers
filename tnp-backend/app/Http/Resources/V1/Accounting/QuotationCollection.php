<?php

namespace App\Http\Resources\V1\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class QuotationCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'quotations' => $this->collection->map(function ($quotation) {
                return [
                    'id' => $quotation->id,
                    'quotation_no' => $quotation->quotation_no,
                    'customer_id' => $quotation->customer_id,
                    'customer_name' => $quotation->customer ? 
                        trim(($quotation->customer->cus_firstname ?? '') . ' ' . ($quotation->customer->cus_lastname ?? '')) ?: 'N/A' 
                        : 'N/A',
                    'customer_company' => $quotation->customer?->cus_company ?? null,
                    
                    // Financial summary
                    'subtotal' => $quotation->subtotal,
                    'tax_rate' => $quotation->tax_rate,
                    'tax_amount' => $quotation->tax_amount,
                    'total_amount' => $quotation->total_amount,
                    'deposit_amount' => $quotation->deposit_amount,
                    'remaining_amount' => $quotation->remaining_amount,
                    
                    // Basic information
                    'status' => $quotation->status,
                    'status_label' => $this->getStatusLabel($quotation->status),
                    'status_color' => $this->getStatusColor($quotation->status),
                    'valid_until' => $quotation->valid_until?->format('Y-m-d'),
                    'version_no' => $quotation->version_no,
                    
                    // Computed properties
                    'is_expired' => $quotation->valid_until ? $quotation->valid_until->isPast() : false,
                    'days_until_expiry' => $quotation->valid_until ? 
                        max(0, now()->diffInDays($quotation->valid_until, false)) : null,
                    'items_count' => $quotation->items_count ?? $quotation->items()->count(),
                    
                    // User information
                    'created_by_name' => $quotation->creator?->name ?? 'System',
                    'approved_by_name' => $quotation->approver?->name ?? null,
                    'approved_at' => $quotation->approved_at?->format('Y-m-d H:i:s'),
                    'rejected_by_name' => $quotation->rejecter?->name ?? null,
                    'rejected_at' => $quotation->rejected_at?->format('Y-m-d H:i:s'),
                    
                    // Timestamps
                    'created_at' => $quotation->created_at?->format('Y-m-d H:i:s'),
                    'updated_at' => $quotation->updated_at?->format('Y-m-d H:i:s'),
                    
                    // Available actions
                    'can_edit' => $quotation->canEdit(),
                    'can_approve' => $quotation->canApprove(),
                    'available_actions' => $this->getAvailableActions($quotation),
                ];
            })
        ];
    }

    /**
     * Get status label for display
     */
    private function getStatusLabel(string $status): string
    {
        $labels = [
            'draft' => 'ฉบับร่าง',
            'pending_review' => 'รอตรวจสอบ',
            'approved' => 'อนุมัติแล้ว',
            'rejected' => 'ไม่อนุมัติ',
            'completed' => 'เสร็จสิ้น'
        ];

        return $labels[$status] ?? $status;
    }

    /**
     * Get status color for UI
     */
    private function getStatusColor(string $status): string
    {
        $colors = [
            'draft' => '#6b7280',        // Gray
            'pending_review' => '#f59e0b', // Amber
            'approved' => '#10b981',       // Green
            'rejected' => '#ef4444',       // Red
            'completed' => '#6366f1'       // Indigo
        ];

        return $colors[$status] ?? '#6b7280';
    }

    /**
     * Get available actions based on current status and user permissions
     */
    private function getAvailableActions($quotation): array
    {
        $actions = [];

        if ($quotation->canEdit()) {
            $actions[] = 'edit';
            $actions[] = 'delete';
        }

        if ($quotation->status === 'draft') {
            $actions[] = 'submit_for_review';
        }

        if ($quotation->canApprove()) {
            $actions[] = 'approve';
            $actions[] = 'reject';
        }

        if ($quotation->status === 'approved') {
            $actions[] = 'create_invoice';
            $actions[] = 'download_pdf';
        }

        $actions[] = 'view';
        $actions[] = 'view_history';

        return $actions;
    }

    /**
     * Get additional information when collecting this resource.
     */
    public function with(Request $request): array
    {
        return [
            'summary' => [
                'total_count' => $this->collection->count(),
                'status_breakdown' => $this->getStatusBreakdown(),
                'total_value' => $this->collection->sum('total_amount'),
                'avg_value' => $this->collection->avg('total_amount'),
            ],
            'filters_applied' => $request->only([
                'status', 'customer_id', 'search', 'date_from', 'date_to'
            ])
        ];
    }

    /**
     * Get status breakdown for summary
     */
    private function getStatusBreakdown(): array
    {
        return $this->collection->groupBy('status')->map(function ($group) {
            return $group->count();
        })->toArray();
    }
}