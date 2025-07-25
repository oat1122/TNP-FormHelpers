<?php

namespace App\Services\Accounting;

use App\Models\Accounting\Quotation;
use App\Models\Accounting\QuotationItem;
use App\Models\Accounting\DocumentStatusHistory;
use App\Models\PricingRequest;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use DateTime;

class QuotationService
{
    /**
     * Generate quotation number
     */
    public function generateQuotationNo(): string
    {
        $date = new DateTime();
        $year = $date->format('Y');
        $month = $date->format('m');
        $prefix = 'QT' . $year . $month;

        $maxId = Quotation::where('quotation_no', 'LIKE', $prefix . '%')
            ->orderBy('created_at', 'desc')
            ->max(DB::raw('CAST(SUBSTRING(quotation_no, -4) AS UNSIGNED)'));

        $nextId = $maxId ? $maxId + 1 : 1;
        return $prefix . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Create quotation from pricing request
     */
    public function createFromPricingRequest(PricingRequest $pricingRequest, array $data): Quotation
    {
        return DB::transaction(function () use ($pricingRequest, $data) {
            // Create quotation
            $quotation = Quotation::create([
                'id' => Str::uuid(),
                'quotation_no' => $this->generateQuotationNo(),
                'pricing_request_id' => $pricingRequest->pr_id,
                'customer_id' => $pricingRequest->pr_cus_id,
                'status' => Quotation::STATUS_DRAFT,
                'subtotal' => $data['subtotal'] ?? 0,
                'tax_rate' => $data['tax_rate'] ?? 7.0,
                'deposit_amount' => $data['deposit_amount'] ?? 0,
                'payment_terms' => $data['payment_terms'] ?? null,
                'valid_until' => $data['valid_until'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $data['created_by'],
                'version_no' => 1
            ]);

            // Create quotation items
            if (!empty($data['items'])) {
                foreach ($data['items'] as $index => $item) {
                    QuotationItem::create([
                        'id' => Str::uuid(),
                        'quotation_id' => $quotation->id,
                        'item_name' => $item['item_name'],
                        'item_description' => $item['item_description'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit' => $item['unit'] ?? 'ชิ้น',
                        'unit_price' => $item['unit_price'],
                        'item_order' => $index + 1
                    ]);
                }
            }

            // Calculate totals
            $quotation->calculateTotals();
            $quotation->save();

            // Record status history
            $this->recordStatusHistory(
                $quotation->id,
                null,
                Quotation::STATUS_DRAFT,
                DocumentStatusHistory::ACTION_TYPE_CREATE,
                'สร้างใบเสนอราคาใหม่',
                $data['created_by']
            );

            return $quotation->load(['items', 'customer', 'pricingRequest']);
        });
    }

    /**
     * Update quotation
     */
    public function updateQuotation(Quotation $quotation, array $data): Quotation
    {
        return DB::transaction(function () use ($quotation, $data) {
            $oldStatus = $quotation->status;

            // Update quotation
            $quotation->update([
                'subtotal' => $data['subtotal'] ?? $quotation->subtotal,
                'tax_rate' => $data['tax_rate'] ?? $quotation->tax_rate,
                'deposit_amount' => $data['deposit_amount'] ?? $quotation->deposit_amount,
                'payment_terms' => $data['payment_terms'] ?? $quotation->payment_terms,
                'valid_until' => $data['valid_until'] ?? $quotation->valid_until,
                'remarks' => $data['remarks'] ?? $quotation->remarks,
                'updated_by' => $data['updated_by'],
                'version_no' => $quotation->version_no + 1
            ]);

            // Update items if provided
            if (isset($data['items'])) {
                // Delete existing items
                $quotation->items()->delete();

                // Create new items
                foreach ($data['items'] as $index => $item) {
                    QuotationItem::create([
                        'id' => Str::uuid(),
                        'quotation_id' => $quotation->id,
                        'item_name' => $item['item_name'],
                        'item_description' => $item['item_description'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit' => $item['unit'] ?? 'ชิ้น',
                        'unit_price' => $item['unit_price'],
                        'item_order' => $index + 1
                    ]);
                }
            }

            // Calculate totals
            $quotation->calculateTotals();
            $quotation->save();

            // Record status history
            $this->recordStatusHistory(
                $quotation->id,
                $oldStatus,
                $quotation->status,
                DocumentStatusHistory::ACTION_TYPE_UPDATE,
                'แก้ไขใบเสนอราคา',
                $data['updated_by']
            );

            return $quotation->load(['items', 'customer', 'pricingRequest']);
        });
    }

    /**
     * Change quotation status
     */
    public function changeStatus(Quotation $quotation, string $newStatus, string $userId, string $remarks = null): Quotation
    {
        return DB::transaction(function () use ($quotation, $newStatus, $userId, $remarks) {
            $oldStatus = $quotation->status;

            $updateData = [
                'status' => $newStatus,
                'updated_by' => $userId,
                'version_no' => $quotation->version_no + 1
            ];

            $actionType = DocumentStatusHistory::ACTION_TYPE_UPDATE;

            // Handle specific status changes
            switch ($newStatus) {
                case Quotation::STATUS_APPROVED:
                    $updateData['approved_by'] = $userId;
                    $updateData['approved_at'] = now();
                    $actionType = DocumentStatusHistory::ACTION_TYPE_APPROVE;
                    break;

                case Quotation::STATUS_REJECTED:
                    $updateData['rejected_by'] = $userId;
                    $updateData['rejected_at'] = now();
                    $updateData['rejection_reason'] = $remarks;
                    $actionType = DocumentStatusHistory::ACTION_TYPE_REJECT;
                    break;
            }

            $quotation->update($updateData);

            // Record status history
            $this->recordStatusHistory(
                $quotation->id,
                $oldStatus,
                $newStatus,
                $actionType,
                $remarks ?? "เปลี่ยนสถานะจาก {$oldStatus} เป็น {$newStatus}",
                $userId
            );

            return $quotation->load(['items', 'customer', 'pricingRequest']);
        });
    }

    /**
     * Record status history
     */
    private function recordStatusHistory(string $documentId, ?string $statusFrom, string $statusTo, string $actionType, string $remarks, string $userId): void
    {
        DocumentStatusHistory::create([
            'id' => Str::uuid(),
            'document_id' => $documentId,
            'document_type' => DocumentStatusHistory::DOCUMENT_TYPE_QUOTATION,
            'status_from' => $statusFrom,
            'status_to' => $statusTo,
            'action_type' => $actionType,
            'remarks' => $remarks,
            'changed_by' => $userId,
            'changed_at' => now()
        ]);
    }

    /**
     * Get quotation with all relationships
     */
    public function getQuotationWithRelations(string $quotationId): ?Quotation
    {
        return Quotation::with([
            'items',
            'customer',
            'pricingRequest',
            'creator',
            'updater',
            'approver',
            'rejecter',
            'statusHistory.user',
            'attachments.uploader',
            'invoices'
        ])->find($quotationId);
    }

    /**
     * Check if quotation can create invoice
     */
    public function canCreateInvoice(Quotation $quotation): bool
    {
        return $quotation->status === Quotation::STATUS_APPROVED;
    }

    /**
     * Get quotations for listing with filters
     */
    public function getQuotationsList(array $filters = [])
    {
        $query = Quotation::with(['customer', 'creator'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if (!empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (!empty($filters['customer_id'])) {
            $query->byCustomer($filters['customer_id']);
        }

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('quotation_no', 'like', $search)
                  ->orWhere('remarks', 'like', $search)
                  ->orWhereHas('customer', function ($customerQuery) use ($search) {
                      $customerQuery->where('cus_name', 'like', $search)
                                   ->orWhere('cus_company', 'like', $search);
                  });
            });
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        // Pagination
        $perPage = $filters['per_page'] ?? 15;
        return $query->paginate($perPage);
    }
}
