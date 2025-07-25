<?php

namespace App\Services\Accounting;

use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\DeliveryNoteItem;
use App\Models\Accounting\Receipt;
use App\Models\Accounting\DocumentStatusHistory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use DateTime;

class DeliveryNoteService
{
    /**
     * Generate delivery note number
     */
    public function generateDeliveryNo(): string
    {
        $date = new DateTime();
        $year = $date->format('Y');
        $month = $date->format('m');
        $prefix = 'DLV-' . $year . $month;

        $maxId = DeliveryNote::where('delivery_no', 'LIKE', $prefix . '%')
            ->orderBy('created_at', 'desc')
            ->max(DB::raw('CAST(SUBSTRING(delivery_no, -4) AS UNSIGNED)'));

        $nextId = $maxId ? $maxId + 1 : 1;
        return $prefix . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Create delivery note from receipt
     */
    public function createFromReceipt(Receipt $receipt, array $data): DeliveryNote
    {
        return DB::transaction(function () use ($receipt, $data) {
            // Create delivery note
            $deliveryNote = DeliveryNote::create([
                'id' => Str::uuid(),
                'delivery_no' => $this->generateDeliveryNo(),
                'receipt_id' => $receipt->id,
                'customer_id' => $receipt->customer_id,
                'status' => DeliveryNote::STATUS_DRAFT,
                'delivery_date' => $data['delivery_date'] ?? now()->toDateString(),
                'delivery_address' => $data['delivery_address'] ?? null,
                'contact_person' => $data['contact_person'] ?? null,
                'contact_phone' => $data['contact_phone'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $data['created_by'],
                'version_no' => 1
            ]);

            // Copy items from receipt with delivery tracking
            foreach ($receipt->items as $receiptItem) {
                $quantityToDeliver = $data['items'][$receiptItem->id]['quantity_delivered'] ?? $receiptItem->quantity;
                
                DeliveryNoteItem::create([
                    'id' => Str::uuid(),
                    'delivery_note_id' => $deliveryNote->id,
                    'item_name' => $receiptItem->item_name,
                    'item_description' => $receiptItem->item_description,
                    'quantity_ordered' => $receiptItem->quantity,
                    'quantity_delivered' => $quantityToDeliver,
                    'unit' => $receiptItem->unit,
                    'item_order' => $receiptItem->item_order
                ]);
            }

            // Record status history
            $this->recordStatusHistory(
                $deliveryNote->id,
                null,
                DeliveryNote::STATUS_DRAFT,
                DocumentStatusHistory::ACTION_TYPE_CREATE,
                'สร้างใบส่งของจากใบเสร็จ/ใบกำกับภาษี ' . $receipt->receipt_no,
                $data['created_by']
            );

            return $deliveryNote->load(['items', 'customer', 'receipt']);
        });
    }

    /**
     * Update delivery note
     */
    public function updateDeliveryNote(DeliveryNote $deliveryNote, array $data): DeliveryNote
    {
        return DB::transaction(function () use ($deliveryNote, $data) {
            $oldStatus = $deliveryNote->status;

            // Update delivery note
            $deliveryNote->update([
                'delivery_date' => $data['delivery_date'] ?? $deliveryNote->delivery_date,
                'delivery_address' => $data['delivery_address'] ?? $deliveryNote->delivery_address,
                'contact_person' => $data['contact_person'] ?? $deliveryNote->contact_person,
                'contact_phone' => $data['contact_phone'] ?? $deliveryNote->contact_phone,
                'remarks' => $data['remarks'] ?? $deliveryNote->remarks,
                'updated_by' => $data['updated_by'],
                'version_no' => $deliveryNote->version_no + 1
            ]);

            // Update items if provided
            if (isset($data['items'])) {
                foreach ($data['items'] as $itemId => $itemData) {
                    $item = $deliveryNote->items()->where('id', $itemId)->first();
                    if ($item && isset($itemData['quantity_delivered'])) {
                        $item->update([
                            'quantity_delivered' => $itemData['quantity_delivered']
                        ]);
                    }
                }
            }

            // Record status history
            $this->recordStatusHistory(
                $deliveryNote->id,
                $oldStatus,
                $deliveryNote->status,
                DocumentStatusHistory::ACTION_TYPE_UPDATE,
                'แก้ไขใบส่งของ',
                $data['updated_by']
            );

            return $deliveryNote->load(['items', 'customer', 'receipt']);
        });
    }

    /**
     * Change delivery note status
     */
    public function changeStatus(DeliveryNote $deliveryNote, string $newStatus, string $userId, string $remarks = null): DeliveryNote
    {
        return DB::transaction(function () use ($deliveryNote, $newStatus, $userId, $remarks) {
            $oldStatus = $deliveryNote->status;

            $updateData = [
                'status' => $newStatus,
                'updated_by' => $userId,
                'version_no' => $deliveryNote->version_no + 1
            ];

            $actionType = DocumentStatusHistory::ACTION_TYPE_UPDATE;

            // Handle specific status changes
            switch ($newStatus) {
                case DeliveryNote::STATUS_APPROVED:
                    $updateData['approved_by'] = $userId;
                    $updateData['approved_at'] = now();
                    $actionType = DocumentStatusHistory::ACTION_TYPE_APPROVE;
                    break;

                case DeliveryNote::STATUS_REJECTED:
                    $updateData['rejected_by'] = $userId;
                    $updateData['rejected_at'] = now();
                    $updateData['rejection_reason'] = $remarks;
                    $actionType = DocumentStatusHistory::ACTION_TYPE_REJECT;
                    break;

                case DeliveryNote::STATUS_DELIVERED:
                    // Mark as delivered - this is usually done after physical delivery
                    $actionType = DocumentStatusHistory::ACTION_TYPE_UPDATE;
                    break;
            }

            $deliveryNote->update($updateData);

            // Record status history
            $this->recordStatusHistory(
                $deliveryNote->id,
                $oldStatus,
                $newStatus,
                $actionType,
                $remarks ?? "เปลี่ยนสถานะจาก {$oldStatus} เป็น {$newStatus}",
                $userId
            );

            return $deliveryNote->load(['items', 'customer', 'receipt']);
        });
    }

    /**
     * Create partial delivery note
     */
    public function createPartialDelivery(Receipt $receipt, array $data): DeliveryNote
    {
        return DB::transaction(function () use ($receipt, $data) {
            // Create delivery note
            $deliveryNote = DeliveryNote::create([
                'id' => Str::uuid(),
                'delivery_no' => $this->generateDeliveryNo(),
                'receipt_id' => $receipt->id,
                'customer_id' => $receipt->customer_id,
                'status' => DeliveryNote::STATUS_DRAFT,
                'delivery_date' => $data['delivery_date'] ?? now()->toDateString(),
                'delivery_address' => $data['delivery_address'] ?? null,
                'contact_person' => $data['contact_person'] ?? null,
                'contact_phone' => $data['contact_phone'] ?? null,
                'remarks' => ($data['remarks'] ?? '') . ' (ส่งของบางส่วน)',
                'created_by' => $data['created_by'],
                'version_no' => 1
            ]);

            // Create items with partial quantities
            foreach ($data['items'] as $index => $item) {
                DeliveryNoteItem::create([
                    'id' => Str::uuid(),
                    'delivery_note_id' => $deliveryNote->id,
                    'item_name' => $item['item_name'],
                    'item_description' => $item['item_description'] ?? null,
                    'quantity_ordered' => $item['quantity_ordered'],
                    'quantity_delivered' => $item['quantity_delivered'],
                    'unit' => $item['unit'] ?? 'ชิ้น',
                    'item_order' => $index + 1
                ]);
            }

            // Record status history
            $this->recordStatusHistory(
                $deliveryNote->id,
                null,
                DeliveryNote::STATUS_DRAFT,
                DocumentStatusHistory::ACTION_TYPE_CREATE,
                'สร้างใบส่งของบางส่วนจากใบเสร็จ/ใบกำกับภาษี ' . $receipt->receipt_no,
                $data['created_by']
            );

            return $deliveryNote->load(['items', 'customer', 'receipt']);
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
            'document_type' => DocumentStatusHistory::DOCUMENT_TYPE_DELIVERY_NOTE,
            'status_from' => $statusFrom,
            'status_to' => $statusTo,
            'action_type' => $actionType,
            'remarks' => $remarks,
            'changed_by' => $userId,
            'changed_at' => now()
        ]);
    }

    /**
     * Get delivery note with all relationships
     */
    public function getDeliveryNoteWithRelations(string $deliveryNoteId): ?DeliveryNote
    {
        return DeliveryNote::with([
            'items',
            'customer',
            'receipt.items',
            'creator',
            'updater',
            'approver',
            'rejecter',
            'statusHistory.user',
            'attachments.uploader'
        ])->find($deliveryNoteId);
    }

    /**
     * Get delivery notes for listing with filters
     */
    public function getDeliveryNotesList(array $filters = [])
    {
        $query = DeliveryNote::with(['customer', 'creator', 'receipt'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if (!empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('delivery_no', 'like', $search)
                  ->orWhere('contact_person', 'like', $search)
                  ->orWhere('remarks', 'like', $search)
                  ->orWhereHas('customer', function ($customerQuery) use ($search) {
                      $customerQuery->where('cus_name', 'like', $search)
                                   ->orWhere('cus_company', 'like', $search);
                  });
            });
        }

        if (!empty($filters['delivery_date_from'])) {
            $query->whereDate('delivery_date', '>=', $filters['delivery_date_from']);
        }

        if (!empty($filters['delivery_date_to'])) {
            $query->whereDate('delivery_date', '<=', $filters['delivery_date_to']);
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

    /**
     * Get pending deliveries
     */
    public function getPendingDeliveries()
    {
        return DeliveryNote::with(['customer', 'creator', 'items'])
            ->where('status', DeliveryNote::STATUS_APPROVED)
            ->orderBy('delivery_date', 'asc')
            ->get();
    }

    /**
     * Get delivery summary by customer
     */
    public function getDeliverySummaryByCustomer(string $customerId, array $dateRange = [])
    {
        $query = DeliveryNote::where('customer_id', $customerId)
            ->where('status', DeliveryNote::STATUS_DELIVERED);

        if (!empty($dateRange['from'])) {
            $query->whereDate('delivery_date', '>=', $dateRange['from']);
        }

        if (!empty($dateRange['to'])) {
            $query->whereDate('delivery_date', '<=', $dateRange['to']);
        }

        return $query->with(['items', 'receipt'])
            ->orderBy('delivery_date', 'desc')
            ->get();
    }
}
