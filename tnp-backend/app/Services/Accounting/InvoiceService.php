<?php

namespace App\Services\Accounting;

use App\Models\Accounting\Invoice;
use App\Models\Accounting\InvoiceItem;
use App\Models\Accounting\Quotation;
use App\Models\Accounting\DocumentStatusHistory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use DateTime;

class InvoiceService
{
    /**
     * Generate invoice number
     */
    public function generateInvoiceNo(): string
    {
        $date = new DateTime();
        $year = $date->format('Y');
        $month = $date->format('m');
        $prefix = 'INV-' . $year . $month;

        $maxId = Invoice::where('invoice_no', 'LIKE', $prefix . '%')
            ->orderBy('created_at', 'desc')
            ->max(DB::raw('CAST(SUBSTRING(invoice_no, -4) AS UNSIGNED)'));

        $nextId = $maxId ? $maxId + 1 : 1;
        return $prefix . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Create invoice from quotation
     */
    public function createFromQuotation(Quotation $quotation, array $data): Invoice
    {
        return DB::transaction(function () use ($quotation, $data) {
            // Create invoice
            $invoice = Invoice::create([
                'id' => Str::uuid(),
                'invoice_no' => $this->generateInvoiceNo(),
                'quotation_id' => $quotation->id,
                'customer_id' => $quotation->customer_id,
                'status' => Invoice::STATUS_DRAFT,
                'subtotal' => $quotation->subtotal,
                'tax_rate' => $quotation->tax_rate,
                'credit_term_days' => $data['credit_term_days'] ?? 30,
                'payment_status' => Invoice::PAYMENT_STATUS_UNPAID,
                'paid_amount' => 0,
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $data['created_by'],
                'version_no' => 1
            ]);

            // Copy items from quotation
            foreach ($quotation->items as $quotationItem) {
                InvoiceItem::create([
                    'id' => Str::uuid(),
                    'invoice_id' => $invoice->id,
                    'item_name' => $quotationItem->item_name,
                    'item_description' => $quotationItem->item_description,
                    'quantity' => $quotationItem->quantity,
                    'unit' => $quotationItem->unit,
                    'unit_price' => $quotationItem->unit_price,
                    'item_order' => $quotationItem->item_order
                ]);
            }

            // Calculate totals and due date
            $invoice->calculateTotals();
            $invoice->calculateDueDate();
            $invoice->save();

            // Record status history
            $this->recordStatusHistory(
                $invoice->id,
                null,
                Invoice::STATUS_DRAFT,
                DocumentStatusHistory::ACTION_TYPE_CREATE,
                'สร้างใบแจ้งหนี้จากใบเสนอราคา ' . $quotation->quotation_no,
                $data['created_by']
            );

            return $invoice->load(['items', 'customer', 'quotation']);
        });
    }

    /**
     * Update invoice
     */
    public function updateInvoice(Invoice $invoice, array $data): Invoice
    {
        return DB::transaction(function () use ($invoice, $data) {
            $oldStatus = $invoice->status;

            // Update invoice
            $invoice->update([
                'subtotal' => $data['subtotal'] ?? $invoice->subtotal,
                'tax_rate' => $data['tax_rate'] ?? $invoice->tax_rate,
                'credit_term_days' => $data['credit_term_days'] ?? $invoice->credit_term_days,
                'remarks' => $data['remarks'] ?? $invoice->remarks,
                'updated_by' => $data['updated_by'],
                'version_no' => $invoice->version_no + 1
            ]);

            // Update items if provided
            if (isset($data['items'])) {
                // Delete existing items
                $invoice->items()->delete();

                // Create new items
                foreach ($data['items'] as $index => $item) {
                    InvoiceItem::create([
                        'id' => Str::uuid(),
                        'invoice_id' => $invoice->id,
                        'item_name' => $item['item_name'],
                        'item_description' => $item['item_description'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit' => $item['unit'] ?? 'ชิ้น',
                        'unit_price' => $item['unit_price'],
                        'item_order' => $index + 1
                    ]);
                }
            }

            // Calculate totals and due date
            $invoice->calculateTotals();
            $invoice->calculateDueDate();
            $invoice->save();

            // Record status history
            $this->recordStatusHistory(
                $invoice->id,
                $oldStatus,
                $invoice->status,
                DocumentStatusHistory::ACTION_TYPE_UPDATE,
                'แก้ไขใบแจ้งหนี้',
                $data['updated_by']
            );

            return $invoice->load(['items', 'customer', 'quotation']);
        });
    }

    /**
     * Change invoice status
     */
    public function changeStatus(Invoice $invoice, string $newStatus, string $userId, string $remarks = null): Invoice
    {
        return DB::transaction(function () use ($invoice, $newStatus, $userId, $remarks) {
            $oldStatus = $invoice->status;

            $updateData = [
                'status' => $newStatus,
                'updated_by' => $userId,
                'version_no' => $invoice->version_no + 1
            ];

            $actionType = DocumentStatusHistory::ACTION_TYPE_UPDATE;

            // Handle specific status changes
            switch ($newStatus) {
                case Invoice::STATUS_APPROVED:
                    $updateData['approved_by'] = $userId;
                    $updateData['approved_at'] = now();
                    $actionType = DocumentStatusHistory::ACTION_TYPE_APPROVE;
                    break;

                case Invoice::STATUS_REJECTED:
                    $updateData['rejected_by'] = $userId;
                    $updateData['rejected_at'] = now();
                    $updateData['rejection_reason'] = $remarks;
                    $actionType = DocumentStatusHistory::ACTION_TYPE_REJECT;
                    break;
            }

            $invoice->update($updateData);

            // Record status history
            $this->recordStatusHistory(
                $invoice->id,
                $oldStatus,
                $newStatus,
                $actionType,
                $remarks ?? "เปลี่ยนสถานะจาก {$oldStatus} เป็น {$newStatus}",
                $userId
            );

            return $invoice->load(['items', 'customer', 'quotation']);
        });
    }

    /**
     * Record payment
     */
    public function recordPayment(Invoice $invoice, float $amount, string $userId, string $remarks = null): Invoice
    {
        return DB::transaction(function () use ($invoice, $amount, $userId, $remarks) {
            $oldPaidAmount = $invoice->paid_amount;
            $newPaidAmount = $oldPaidAmount + $amount;

            $invoice->update([
                'paid_amount' => $newPaidAmount,
                'updated_by' => $userId,
                'version_no' => $invoice->version_no + 1
            ]);

            // Update payment status and remaining amount
            $invoice->updatePaymentStatus();
            $invoice->calculateTotals();
            $invoice->save();

            // Record status history
            $this->recordStatusHistory(
                $invoice->id,
                $invoice->status,
                $invoice->status,
                DocumentStatusHistory::ACTION_TYPE_UPDATE,
                $remarks ?? "บันทึกการชำระเงิน จำนวน " . number_format($amount, 2) . " บาท",
                $userId
            );

            return $invoice->load(['items', 'customer', 'quotation']);
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
            'document_type' => DocumentStatusHistory::DOCUMENT_TYPE_INVOICE,
            'status_from' => $statusFrom,
            'status_to' => $statusTo,
            'action_type' => $actionType,
            'remarks' => $remarks,
            'changed_by' => $userId,
            'changed_at' => now()
        ]);
    }

    /**
     * Get invoice with all relationships
     */
    public function getInvoiceWithRelations(string $invoiceId): ?Invoice
    {
        return Invoice::with([
            'items',
            'customer',
            'quotation.items',
            'creator',
            'updater',
            'approver',
            'rejecter',
            'statusHistory.user',
            'attachments.uploader',
            'receipts'
        ])->find($invoiceId);
    }

    /**
     * Check if invoice can create receipt
     */
    public function canCreateReceipt(Invoice $invoice): bool
    {
        return $invoice->status === Invoice::STATUS_APPROVED;
    }

    /**
     * Get invoices for listing with filters
     */
    public function getInvoicesList(array $filters = [])
    {
        $query = Invoice::with(['customer', 'creator', 'quotation'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if (!empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (!empty($filters['payment_status'])) {
            $query->byPaymentStatus($filters['payment_status']);
        }

        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', $search)
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

        if (!empty($filters['due_date_from'])) {
            $query->whereDate('due_date', '>=', $filters['due_date_from']);
        }

        if (!empty($filters['due_date_to'])) {
            $query->whereDate('due_date', '<=', $filters['due_date_to']);
        }

        // Pagination
        $perPage = $filters['per_page'] ?? 15;
        return $query->paginate($perPage);
    }

    /**
     * Get overdue invoices
     */
    public function getOverdueInvoices()
    {
        return Invoice::with(['customer', 'creator'])
            ->where('status', Invoice::STATUS_APPROVED)
            ->where('payment_status', '!=', Invoice::PAYMENT_STATUS_PAID)
            ->where('due_date', '<', now())
            ->orderBy('due_date', 'asc')
            ->get();
    }
}
