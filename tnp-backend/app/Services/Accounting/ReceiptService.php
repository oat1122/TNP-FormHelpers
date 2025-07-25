<?php

namespace App\Services\Accounting;

use App\Models\Accounting\Receipt;
use App\Models\Accounting\ReceiptItem;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\DocumentStatusHistory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use DateTime;

class ReceiptService
{
    /**
     * Generate receipt number
     */
    public function generateReceiptNo(): string
    {
        $date = new DateTime();
        $year = $date->format('Y');
        $month = $date->format('m');
        $prefix = 'RCPT-' . $year . $month;

        $maxId = Receipt::where('receipt_no', 'LIKE', $prefix . '%')
            ->orderBy('created_at', 'desc')
            ->max(DB::raw('CAST(SUBSTRING(receipt_no, -4) AS UNSIGNED)'));

        $nextId = $maxId ? $maxId + 1 : 1;
        return $prefix . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate tax invoice number
     */
    public function generateTaxInvoiceNo(): string
    {
        $date = new DateTime();
        $year = $date->format('Y');
        $month = $date->format('m');
        $prefix = 'TAX-' . $year . $month;

        $maxId = Receipt::where('tax_invoice_no', 'LIKE', $prefix . '%')
            ->orderBy('created_at', 'desc')
            ->max(DB::raw('CAST(SUBSTRING(tax_invoice_no, -4) AS UNSIGNED)'));

        $nextId = $maxId ? $maxId + 1 : 1;
        return $prefix . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Create receipt from invoice
     */
    public function createFromInvoice(Invoice $invoice, array $data): Receipt
    {
        return DB::transaction(function () use ($invoice, $data) {
            // Create receipt
            $receipt = Receipt::create([
                'id' => Str::uuid(),
                'receipt_no' => $this->generateReceiptNo(),
                'tax_invoice_no' => $this->generateTaxInvoiceNo(),
                'invoice_id' => $invoice->id,
                'customer_id' => $invoice->customer_id,
                'status' => Receipt::STATUS_DRAFT,
                'subtotal' => $invoice->subtotal,
                'tax_rate' => $invoice->tax_rate,
                'payment_method' => $data['payment_method'] ?? Receipt::PAYMENT_METHOD_BANK_TRANSFER,
                'payment_reference' => $data['payment_reference'] ?? null,
                'payment_date' => $data['payment_date'] ?? now()->toDateString(),
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $data['created_by'],
                'version_no' => 1
            ]);

            // Copy items from invoice
            foreach ($invoice->items as $invoiceItem) {
                ReceiptItem::create([
                    'id' => Str::uuid(),
                    'receipt_id' => $receipt->id,
                    'item_name' => $invoiceItem->item_name,
                    'item_description' => $invoiceItem->item_description,
                    'quantity' => $invoiceItem->quantity,
                    'unit' => $invoiceItem->unit,
                    'unit_price' => $invoiceItem->unit_price,
                    'item_order' => $invoiceItem->item_order
                ]);
            }

            // Calculate totals
            $receipt->calculateTotals();
            $receipt->save();

            // Record status history
            $this->recordStatusHistory(
                $receipt->id,
                null,
                Receipt::STATUS_DRAFT,
                DocumentStatusHistory::ACTION_TYPE_CREATE,
                'สร้างใบเสร็จ/ใบกำกับภาษีจากใบแจ้งหนี้ ' . $invoice->invoice_no,
                $data['created_by']
            );

            return $receipt->load(['items', 'customer', 'invoice']);
        });
    }

    /**
     * Update receipt
     */
    public function updateReceipt(Receipt $receipt, array $data): Receipt
    {
        return DB::transaction(function () use ($receipt, $data) {
            $oldStatus = $receipt->status;

            // Update receipt
            $receipt->update([
                'tax_rate' => $data['tax_rate'] ?? $receipt->tax_rate,
                'payment_method' => $data['payment_method'] ?? $receipt->payment_method,
                'payment_reference' => $data['payment_reference'] ?? $receipt->payment_reference,
                'payment_date' => $data['payment_date'] ?? $receipt->payment_date,
                'remarks' => $data['remarks'] ?? $receipt->remarks,
                'updated_by' => $data['updated_by'],
                'version_no' => $receipt->version_no + 1
            ]);

            // Update items if provided
            if (isset($data['items'])) {
                // Delete existing items
                $receipt->items()->delete();

                // Create new items
                foreach ($data['items'] as $index => $item) {
                    ReceiptItem::create([
                        'id' => Str::uuid(),
                        'receipt_id' => $receipt->id,
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
            $receipt->calculateTotals();
            $receipt->save();

            // Record status history
            $this->recordStatusHistory(
                $receipt->id,
                $oldStatus,
                $receipt->status,
                DocumentStatusHistory::ACTION_TYPE_UPDATE,
                'แก้ไขใบเสร็จ/ใบกำกับภาษี',
                $data['updated_by']
            );

            return $receipt->load(['items', 'customer', 'invoice']);
        });
    }

    /**
     * Change receipt status
     */
    public function changeStatus(Receipt $receipt, string $newStatus, string $userId, string $remarks = null): Receipt
    {
        return DB::transaction(function () use ($receipt, $newStatus, $userId, $remarks) {
            $oldStatus = $receipt->status;

            $updateData = [
                'status' => $newStatus,
                'updated_by' => $userId,
                'version_no' => $receipt->version_no + 1
            ];

            $actionType = DocumentStatusHistory::ACTION_TYPE_UPDATE;

            // Handle specific status changes
            switch ($newStatus) {
                case Receipt::STATUS_APPROVED:
                    $updateData['approved_by'] = $userId;
                    $updateData['approved_at'] = now();
                    $actionType = DocumentStatusHistory::ACTION_TYPE_APPROVE;
                    
                    // Update invoice payment when receipt is approved
                    if ($receipt->invoice) {
                        $invoice = $receipt->invoice;
                        $invoiceService = new InvoiceService();
                        $invoiceService->recordPayment(
                            $invoice,
                            $receipt->total_amount,
                            $userId,
                            'ชำระเงินผ่านใบเสร็จ ' . $receipt->receipt_no
                        );
                    }
                    break;

                case Receipt::STATUS_REJECTED:
                    $updateData['rejected_by'] = $userId;
                    $updateData['rejected_at'] = now();
                    $updateData['rejection_reason'] = $remarks;
                    $actionType = DocumentStatusHistory::ACTION_TYPE_REJECT;
                    break;
            }

            $receipt->update($updateData);

            // Record status history
            $this->recordStatusHistory(
                $receipt->id,
                $oldStatus,
                $newStatus,
                $actionType,
                $remarks ?? "เปลี่ยนสถานะจาก {$oldStatus} เป็น {$newStatus}",
                $userId
            );

            return $receipt->load(['items', 'customer', 'invoice']);
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
            'document_type' => DocumentStatusHistory::DOCUMENT_TYPE_RECEIPT,
            'status_from' => $statusFrom,
            'status_to' => $statusTo,
            'action_type' => $actionType,
            'remarks' => $remarks,
            'changed_by' => $userId,
            'changed_at' => now()
        ]);
    }

    /**
     * Get receipt with all relationships
     */
    public function getReceiptWithRelations(string $receiptId): ?Receipt
    {
        return Receipt::with([
            'items',
            'customer',
            'invoice.items',
            'creator',
            'updater',
            'approver',
            'rejecter',
            'statusHistory.user',
            'attachments.uploader',
            'deliveryNotes'
        ])->find($receiptId);
    }

    /**
     * Check if receipt can create delivery note
     */
    public function canCreateDeliveryNote(Receipt $receipt): bool
    {
        return $receipt->status === Receipt::STATUS_APPROVED;
    }

    /**
     * Get receipts for listing with filters
     */
    public function getReceiptsList(array $filters = [])
    {
        $query = Receipt::with(['customer', 'creator', 'invoice'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if (!empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (!empty($filters['payment_method'])) {
            $query->byPaymentMethod($filters['payment_method']);
        }

        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('receipt_no', 'like', $search)
                  ->orWhere('tax_invoice_no', 'like', $search)
                  ->orWhere('payment_reference', 'like', $search)
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

        if (!empty($filters['payment_date_from'])) {
            $query->whereDate('payment_date', '>=', $filters['payment_date_from']);
        }

        if (!empty($filters['payment_date_to'])) {
            $query->whereDate('payment_date', '<=', $filters['payment_date_to']);
        }

        // Pagination
        $perPage = $filters['per_page'] ?? 15;
        return $query->paginate($perPage);
    }
}
