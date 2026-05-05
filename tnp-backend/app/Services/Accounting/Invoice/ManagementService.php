<?php

namespace App\Services\Accounting\Invoice;

use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\InvoiceItem;
use App\Models\Accounting\Quotation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Invoice CRUD-minus-create + list endpoints + deposit display order /
 * mode toggles (presentation-only writes).
 */
class ManagementService
{
    public function __construct(
        private Calculator $calculator,
    ) {}

    /**
     * Update an invoice (header fields + optional items array).
     *
     * @param  array<string, mixed>  $updateData
     */
    public function update(string $invoiceId, array $updateData, ?string $updatedBy = null): Invoice
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            $editableStatuses = ['draft', 'pending', 'pending_after', 'approved'];
            if (! in_array($invoice->status, $editableStatuses)) {
                throw new \Exception('Invoice cannot be updated in current status: '.$invoice->status);
            }

            // Items first (deletes + recreates), then header fields.
            if (isset($updateData['items']) && is_array($updateData['items'])) {
                $this->updateInvoiceItems($invoice->id, $updateData['items'], $updatedBy);
                unset($updateData['items']);
            }

            foreach ($updateData as $key => $value) {
                if ($invoice->isFillable($key)) {
                    $invoice->$key = $value;
                }
            }

            // Recalculate before-VAT tracking fields when financial inputs change.
            $financialFields = ['subtotal', 'has_vat', 'vat_percentage', 'deposit_mode', 'deposit_percentage', 'deposit_amount'];
            $hasFinancialUpdates = ! empty(array_intersect(array_keys($updateData), $financialFields));

            if ($hasFinancialUpdates) {
                $beforeVatData = [
                    'subtotal' => $invoice->subtotal,
                    'has_vat' => $invoice->has_vat,
                    'vat_percentage' => $invoice->vat_percentage,
                    'deposit_mode' => $invoice->deposit_mode,
                    'deposit_percentage' => $invoice->deposit_percentage,
                    'deposit_amount' => $invoice->deposit_amount,
                ];

                $calculatedFields = $this->calculator->calculateBeforeVatFields($beforeVatData);
                $invoice->subtotal_before_vat = $calculatedFields['subtotal_before_vat'];
                $invoice->deposit_amount_before_vat = $calculatedFields['deposit_amount_before_vat'];
            }

            $invoice->updated_by = $updatedBy;
            $invoice->save();

            // History — log only simple field changes (skip JSON blobs / images).
            $updatedFields = array_keys($updateData);
            $changedFields = array_filter($updatedFields, function ($field) use ($invoice) {
                return $invoice->isFillable($field) && ! in_array($field, [
                    'primary_pricing_request_ids', 'customer_snapshot',
                    'signature_images', 'sample_images',
                ]);
            });

            if (! empty($changedFields)) {
                DocumentHistory::logAction(
                    'invoice',
                    $invoiceId,
                    'update',
                    $updatedBy,
                    'แก้ไขใบแจ้งหนี้: '.implode(', ', $changedFields)
                );
            }

            DB::commit();

            return $invoice->fresh(['items']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice\\ManagementService::update error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Paginated list of invoices with filters (search, status, dates, etc.).
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<Invoice>
     */
    public function getList(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        try {
            $query = Invoice::with(['quotation', 'customer', 'documentHistory', 'manager', 'items'])
                ->select('invoices.*')
                ->leftJoin('quotations', 'quotations.id', '=', 'invoices.quotation_id')
                ->addSelect(DB::raw('quotations.number as quotation_number'));

            if (! empty($filters['search'])) {
                $search = trim($filters['search']);
                $like = "%{$search}%";

                $joinedMaster = false;
                if (Schema::hasTable('master_customers')) {
                    $query->leftJoin('master_customers', 'invoices.customer_id', '=', 'master_customers.cus_id');
                    $joinedMaster = true;
                }

                $query->where(function ($q) use ($like, $joinedMaster) {
                    $q->where('invoices.number', 'like', $like)
                        ->orWhere('invoices.customer_company', 'like', $like)
                        ->orWhere('quotations.work_name', 'like', $like)
                        ->orWhere('quotations.number', 'like', $like);

                    if ($joinedMaster) {
                        foreach (['cus_company', 'cus_firstname', 'cus_lastname', 'cus_name'] as $col) {
                            if (Schema::hasColumn('master_customers', $col)) {
                                $q->orWhere("master_customers.$col", 'like', $like);
                            }
                        }
                    }
                });
            }

            if (! empty($filters['status']) && is_array($filters['status'])) {
                $query->where($filters['status'][0], $filters['status'][1], $filters['status'][2]);
            } elseif (! empty($filters['status'])) {
                $query->where('invoices.status', $filters['status']);
            }

            if (! empty($filters['status_before']) && is_array($filters['status_before'])) {
                $query->where($filters['status_before'][0], $filters['status_before'][1], $filters['status_before'][2]);
            }

            if (! empty($filters['status_after']) && is_array($filters['status_after'])) {
                $query->where($filters['status_after'][0], $filters['status_after'][1], $filters['status_after'][2]);
            }

            if (! empty($filters['type'])) {
                $query->where('invoices.type', $filters['type']);
            }

            if (! empty($filters['customer_id'])) {
                $query->where('invoices.customer_id', $filters['customer_id']);
            }

            if (! empty($filters['date_from'])) {
                $query->whereDate('invoices.created_at', '>=', $filters['date_from']);
            }

            if (! empty($filters['date_to'])) {
                $query->whereDate('invoices.created_at', '<=', $filters['date_to']);
            }

            if (! empty($filters['due_date_from'])) {
                $query->whereDate('invoices.due_date', '>=', $filters['due_date_from']);
            }

            if (! empty($filters['due_date_to'])) {
                $query->whereDate('invoices.due_date', '<=', $filters['due_date_to']);
            }

            if (! empty($filters['overdue'])) {
                $query->where('invoices.due_date', '<', now())
                    ->whereIn('invoices.status', ['sent', 'partial_paid']);
            }

            return $query->orderBy('invoices.created_at', 'desc')->paginate($perPage);

        } catch (\Exception $e) {
            Log::error('Invoice\\ManagementService::getList error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Quotations that are signed + approved + have no invoice yet — used by
     * the Invoices page as a candidate list for invoice creation.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<Quotation>
     */
    public function getQuotationsAwaiting(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        try {
            $with = ['customer', 'creator', 'pricingRequest', 'items', 'company'];
            if (Schema::hasTable('quotation_pricing_requests') &&
                method_exists(Quotation::class, 'pricingRequests')) {
                $with[] = 'pricingRequests';
            }

            $query = Quotation::with($with)
                ->where('status', 'approved')
                ->whereNotNull('signature_images')
                ->whereRaw('JSON_VALID(signature_images)')
                ->whereRaw('JSON_LENGTH(signature_images) > 0')
                ->whereNotExists(function ($q) {
                    $q->select(DB::raw(1))
                        ->from('invoices')
                        ->whereColumn('invoices.quotation_id', 'quotations.id');
                });

            if (! empty($filters['search'])) {
                $rawSearch = trim($filters['search']);
                $like = '%'.$rawSearch.'%';

                $hasCustomerCompany = Schema::hasColumn('quotations', 'customer_company');
                $hasCustomerFirst = Schema::hasColumn('quotations', 'customer_firstname');
                $hasCustomerLast = Schema::hasColumn('quotations', 'customer_lastname');

                $joinedMaster = false;
                if (Schema::hasTable('master_customers')) {
                    $query->leftJoin('master_customers', 'quotations.customer_id', '=', 'master_customers.cus_id');
                    $joinedMaster = true;
                }

                $query->select('quotations.*');

                $query->where(function ($q) use ($like, $hasCustomerCompany, $hasCustomerFirst, $hasCustomerLast, $joinedMaster) {
                    $q->where('quotations.number', 'like', $like)
                        ->orWhere('quotations.work_name', 'like', $like);
                    if ($hasCustomerCompany) {
                        $q->orWhere('quotations.customer_company', 'like', $like);
                    }
                    if ($hasCustomerFirst) {
                        $q->orWhere('quotations.customer_firstname', 'like', $like);
                    }
                    if ($hasCustomerLast) {
                        $q->orWhere('quotations.customer_lastname', 'like', $like);
                    }
                    if ($joinedMaster) {
                        foreach (['cus_company', 'cus_firstname', 'cus_lastname', 'cus_name'] as $col) {
                            if (Schema::hasColumn('master_customers', $col)) {
                                $q->orWhere("master_customers.$col", 'like', $like);
                            }
                        }
                    }
                });
            }

            return $query->orderBy('created_at', 'desc')->paginate(min($perPage, 50));
        } catch (\Exception $e) {
            Log::error('Invoice\\ManagementService::getQuotationsAwaiting error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Update the deposit_display_order column (presentation toggle — does
     * NOT change status). Logs history when the value actually changes.
     */
    public function updateDepositDisplayOrder(string $invoiceId, string $order, ?string $updatedBy = null): Invoice
    {
        if (! in_array($order, ['before', 'after'], true)) {
            throw new \InvalidArgumentException('Invalid deposit display order');
        }

        try {
            DB::beginTransaction();
            $invoice = Invoice::findOrFail($invoiceId);
            $prev = $invoice->deposit_display_order ?? 'before';
            $invoice->deposit_display_order = $order;
            $invoice->updated_by = $updatedBy;
            $invoice->save();

            if ($prev !== $order) {
                DocumentHistory::logAction(
                    'invoice',
                    $invoiceId,
                    'update_deposit_display_order',
                    $updatedBy,
                    "เปลี่ยนรูปแบบแสดงมัดจำ: {$prev} -> {$order}"
                );
            }

            DB::commit();

            return $invoice->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice\\ManagementService::updateDepositDisplayOrder error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Set the deposit display mode via forceFill (bypasses fillable guard).
     * Same effect as updateDepositDisplayOrder but logs differently —
     * preserved for backward-compat.
     */
    public function setDepositMode(string $invoiceId, string $mode, ?string $updatedBy = null): Invoice
    {
        if (! in_array($mode, ['before', 'after'], true)) {
            throw new \InvalidArgumentException('Invalid mode. Must be "before" or "after".');
        }

        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);
            $oldMode = $invoice->deposit_display_order;

            $invoice->forceFill(['deposit_display_order' => $mode]);
            if ($updatedBy) {
                $invoice->updated_by = $updatedBy;
            }
            $invoice->save();

            if ($oldMode !== $mode) {
                DocumentHistory::logAction(
                    'invoice',
                    $invoiceId,
                    'change_deposit_mode',
                    $updatedBy,
                    "เปลี่ยนโหมดจาก {$oldMode} เป็น {$mode}"
                );
            }

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice\\ManagementService::setDepositMode error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Replace all invoice items with a fresh list from the FE. Supports both
     * grouped (with sizeRows) and flat per-item shapes.
     *
     * @param  array<int, array<string, mixed>>  $items
     */
    private function updateInvoiceItems(string $invoiceId, array $items, ?string $updatedBy = null): void
    {
        try {
            InvoiceItem::where('invoice_id', $invoiceId)->delete();

            foreach ($items as $groupIndex => $group) {
                if (isset($group['sizeRows']) && is_array($group['sizeRows']) && count($group['sizeRows']) > 0) {
                    foreach ($group['sizeRows'] as $rowIndex => $sizeRow) {
                        $invoiceItem = new InvoiceItem;
                        $invoiceItem->id = (string) Str::uuid();
                        $invoiceItem->invoice_id = $invoiceId;
                        $invoiceItem->quotation_item_id = $group['quotation_item_id'] ?? null;
                        $invoiceItem->pricing_request_id = $group['pricing_request_id'] ?? null;
                        $invoiceItem->item_name = $group['name'] ?? 'งานที่ '.($groupIndex + 1);
                        $invoiceItem->item_description = $group['item_description'] ?? null;
                        $invoiceItem->sequence_order = ($groupIndex * 100) + ($rowIndex + 1);
                        $invoiceItem->pattern = $group['pattern'] ?? null;
                        $invoiceItem->fabric_type = $group['fabric_type'] ?? $group['fabricType'] ?? null;
                        $invoiceItem->color = $group['color'] ?? null;
                        $invoiceItem->size = $sizeRow['size'] ?? null;
                        $invoiceItem->quantity = (int) ($sizeRow['quantity'] ?? 0);
                        $invoiceItem->unit_price = (float) ($sizeRow['unitPrice'] ?? 0);
                        $invoiceItem->unit = $group['unit'] ?? 'ชิ้น';
                        $invoiceItem->notes = $sizeRow['notes'] ?? null;
                        $invoiceItem->discount_percentage = (float) ($group['discount_percentage'] ?? 0);
                        $invoiceItem->discount_amount = (float) ($group['discount_amount'] ?? 0);
                        $invoiceItem->status = $group['status'] ?? 'draft';
                        $invoiceItem->updated_by = $updatedBy;

                        $invoiceItem->save();
                    }
                } else {
                    $invoiceItem = new InvoiceItem;
                    $invoiceItem->id = (string) Str::uuid();
                    $invoiceItem->invoice_id = $invoiceId;
                    $invoiceItem->quotation_item_id = $group['quotation_item_id'] ?? null;
                    $invoiceItem->pricing_request_id = $group['pricing_request_id'] ?? null;
                    $invoiceItem->item_name = $group['name'] ?? 'งานที่ '.($groupIndex + 1);
                    $invoiceItem->item_description = $group['item_description'] ?? null;
                    $invoiceItem->sequence_order = $groupIndex + 1;
                    $invoiceItem->pattern = $group['pattern'] ?? null;
                    $invoiceItem->fabric_type = $group['fabric_type'] ?? $group['fabricType'] ?? null;
                    $invoiceItem->color = $group['color'] ?? null;
                    $invoiceItem->size = $group['size'] ?? null;
                    $invoiceItem->quantity = (int) ($group['quantity'] ?? 0);
                    $invoiceItem->unit_price = (float) ($group['unit_price'] ?? $group['unitPrice'] ?? 0);
                    $invoiceItem->unit = $group['unit'] ?? 'ชิ้น';
                    $invoiceItem->notes = $group['notes'] ?? null;
                    $invoiceItem->discount_percentage = (float) ($group['discount_percentage'] ?? 0);
                    $invoiceItem->discount_amount = (float) ($group['discount_amount'] ?? 0);
                    $invoiceItem->status = $group['status'] ?? 'draft';
                    $invoiceItem->updated_by = $updatedBy;

                    $invoiceItem->save();
                }
            }

            DocumentHistory::logAction(
                'invoice',
                $invoiceId,
                'update_items',
                $updatedBy,
                'อัพเดตรายการสินค้า: '.count($items).' รายการ'
            );

        } catch (\Exception $e) {
            Log::error('Invoice\\ManagementService::updateInvoiceItems error: '.$e->getMessage());
            throw $e;
        }
    }
}
