<?php

namespace App\Services\Accounting\Receipt;

use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\Receipt;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Receipt list + update operations (CRUD minus create + delete).
 */
class ManagementService
{
    public function __construct(
        private Calculator $calculator,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function getList(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Receipt::with(['invoice', 'documentHistory'])
            ->select('receipts.*');

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhere('customer_company', 'like', "%{$search}%")
                    ->orWhere('work_name', 'like', "%{$search}%")
                    ->orWhere('tax_invoice_number', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['receipt_type'])) {
            $query->where('type', $filters['receipt_type']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (! empty($filters['payment_method'])) {
            $query->where('payment_method', $filters['payment_method']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Update a receipt while it is still in 'draft'.
     *
     * @param  array<string, mixed>  $updateData
     */
    public function update(string $receiptId, array $updateData, ?string $updatedBy = null): Receipt
    {
        return DB::transaction(function () use ($receiptId, $updateData, $updatedBy) {
            $receipt = Receipt::findOrFail($receiptId);

            if ($receipt->status !== 'draft') {
                throw new \Exception('Receipt cannot be updated in current status');
            }

            $oldData = $receipt->toArray();
            $receipt->fill($this->normalizeUpdateData($updateData, $receipt));
            $this->calculator->assignTaxInvoiceNumberIfNeeded($receipt);
            $receipt->save();

            $changes = array_diff_assoc($receipt->toArray(), $oldData);
            if (! empty($changes)) {
                DocumentHistory::logAction(
                    'receipt',
                    $receiptId,
                    'update',
                    $updatedBy,
                    'Updated receipt: '.implode(', ', array_keys($changes))
                );
            }

            return $receipt->fresh();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizeUpdateData(array $data, Receipt $receipt): array
    {
        $payload = $this->calculator->copyReceiptColumns($data, false);

        if (array_key_exists('type', $data) || array_key_exists('receipt_type', $data)) {
            $payload['type'] = $this->calculator->resolveReceiptType($data);
        }

        if (array_key_exists('payment_reference', $data) || array_key_exists('reference_number', $data)) {
            $payload['payment_reference'] = $data['payment_reference'] ?? ($data['reference_number'] ?? null);
        }

        if (array_key_exists('tax_amount', $data) || array_key_exists('vat_amount', $data)) {
            $payload['tax_amount'] = $data['tax_amount'] ?? $data['vat_amount'];
        }

        if (array_key_exists('subtotal', $data)) {
            $payload['subtotal'] = $data['subtotal'];
        }

        if (
            array_key_exists('total_amount', $data)
            || array_key_exists('payment_amount', $data)
            || array_key_exists('amount', $data)
        ) {
            $totalAmount = $this->calculator->resolveTotalAmount($data);
            $type = $payload['type'] ?? $receipt->type;
            $amounts = $this->calculator->calculateReceiptAmounts($totalAmount, $type);

            $payload['total_amount'] = $totalAmount;
            $payload['subtotal'] = $payload['subtotal'] ?? $amounts['subtotal'];
            $payload['tax_amount'] = $payload['tax_amount'] ?? $amounts['tax_amount'];
        }

        return $payload;
    }
}
