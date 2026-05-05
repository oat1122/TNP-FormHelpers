<?php

namespace App\Services\Accounting\Invoice;

use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\InvoiceItem;
use App\Models\Accounting\Quotation;
use App\Models\Company;
use App\Services\Accounting\AutofillService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Invoice creation flows: manual `create()` + one-click
 * `createFromQuotation()` (with item copy).
 */
class CreationService
{
    public function __construct(
        private AutofillService $autofillService,
        private Calculator $calculator,
    ) {}

    /**
     * One-click conversion from a Quotation to an Invoice.
     *
     * @param  array<string, mixed>  $invoiceData
     */
    public function createFromQuotation(string $quotationId, array $invoiceData, ?string $createdBy = null): Invoice
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::with(['items', 'customer'])
                ->lockForUpdate()
                ->findOrFail($quotationId);

            if (! $quotation->canConvertToInvoice()) {
                throw new \Exception("Quotation must be approved or sent before converting to invoice (current status: {$quotation->status})");
            }

            $autofillData = $this->autofillService->getCascadeAutofillForInvoice($quotationId);

            $invoice = new Invoice;
            $invoice->id = (string) Str::uuid();
            $invoice->company_id = $quotation->company_id
                ?? (auth()->user()->company_id ?? optional(Company::where('is_active', true)->first())->id);

            // deposit_display_order must be set before generating the number.
            $invoice->deposit_display_order = $invoiceData['deposit_display_order'] ?? 'before';
            $invoice->number = 'DRAFT-'.now()->format('YmdHis').'-'.substr($invoice->id, 0, 8);
            $invoice->quotation_id = $quotation->id;

            // Primary Pricing Request linkage
            $invoice->primary_pricing_request_id = $quotation->primary_pricing_request_id;
            $invoice->primary_pricing_request_ids = $quotation->primary_pricing_request_ids;

            // Customer auto-fill (with optional manual billing-address override).
            $invoice->customer_id = $autofillData['customer_id'];
            $invoice->customer_company = $autofillData['customer_company'];
            $invoice->customer_tax_id = $autofillData['customer_tax_id'];
            $invoice->customer_address = $invoiceData['custom_billing_address'] ?? $autofillData['customer_address'];
            $invoice->customer_zip_code = $autofillData['customer_zip_code'];
            $invoice->customer_tel_1 = $autofillData['customer_tel_1'];
            $invoice->customer_email = $autofillData['customer_email'];
            $invoice->customer_firstname = $autofillData['customer_firstname'];
            $invoice->customer_lastname = $autofillData['customer_lastname'];

            // Snapshot customer data at creation time.
            $invoice->customer_snapshot = json_encode([
                'customer_id' => $invoice->customer_id,
                'customer_company' => $invoice->customer_company,
                'customer_tax_id' => $invoice->customer_tax_id,
                'customer_address' => $invoice->customer_address,
                'customer_zip_code' => $invoice->customer_zip_code,
                'customer_tel_1' => $invoice->customer_tel_1,
                'customer_email' => $invoice->customer_email,
                'customer_firstname' => $invoice->customer_firstname,
                'customer_lastname' => $invoice->customer_lastname,
                'original_customer_address' => $autofillData['customer_address'],
                'custom_address_used' => ! empty($invoiceData['custom_billing_address']),
                'snapshot_at' => now()->toISOString(),
            ]);

            $invoice->customer_data_source = $invoiceData['customer_data_source'] ?? 'master';

            // Type + financial fields (UI-supplied + server-recomputed VAT).
            $invoiceType = $invoiceData['type'] ?? 'remaining';
            $invoice->type = $invoiceType;
            $invoice->subtotal = $invoiceData['subtotal'] ?? 0;
            $invoice->special_discount_percentage = $invoiceData['special_discount_percentage'] ?? 0;
            $invoice->special_discount_amount = $invoiceData['special_discount_amount'] ?? 0;

            // VAT configuration.
            $invoice->has_vat = $invoiceData['has_vat'] ?? $quotation->has_vat ?? true;
            $invoice->vat_percentage = $invoiceData['vat_percentage'] ?? $quotation->vat_percentage ?? 7;
            $invoice->pricing_mode = $invoiceData['pricing_mode'] ?? $quotation->pricing_mode ?? 'net';

            // Recompute VAT server-side — never trust frontend-provided vat_amount.
            $vatRate = $invoice->has_vat ? floatval($invoice->vat_percentage) : 0;
            $subtotalForVat = floatval($invoice->subtotal);
            if ($invoice->has_vat && $vatRate > 0) {
                if ($invoice->pricing_mode === 'vat_included') {
                    $invoice->vat_amount = round($subtotalForVat - ($subtotalForVat / (1 + $vatRate / 100)), 2);
                } else {
                    $invoice->vat_amount = round($subtotalForVat * ($vatRate / 100), 2);
                }
            } else {
                $invoice->vat_amount = 0;
            }

            // Withholding tax.
            $invoice->has_withholding_tax = $invoiceData['has_withholding_tax'] ?? false;
            $invoice->withholding_tax_percentage = $invoiceData['withholding_tax_percentage'] ?? 0;
            $invoice->withholding_tax_amount = $invoiceData['withholding_tax_amount'] ?? 0;

            $invoice->total_amount = $invoiceData['total_amount'] ?? 0;
            $invoice->final_total_amount = $invoiceData['final_total_amount'] ?? $invoice->total_amount;

            // Deposit info.
            $invoice->deposit_mode = $invoiceData['deposit_mode'] ?? $quotation->deposit_mode ?? 'percentage';
            $invoice->deposit_percentage = $invoiceData['deposit_percentage'] ?? $quotation->deposit_percentage ?? 0;
            $invoice->deposit_amount = $invoiceData['deposit_amount'] ?? $quotation->deposit_amount ?? 0;

            // Pre-VAT tracking fields.
            $beforeVatData = array_merge($invoiceData, [
                'subtotal' => $invoice->subtotal,
                'has_vat' => $invoice->has_vat,
                'vat_percentage' => $invoice->vat_percentage,
                'pricing_mode' => $invoice->pricing_mode,
                'deposit_mode' => $invoice->deposit_mode,
                'deposit_percentage' => $invoice->deposit_percentage,
                'deposit_amount' => $invoice->deposit_amount,
            ]);

            $calculatedFields = $this->calculator->calculateBeforeVatFields($beforeVatData);
            $invoice->subtotal_before_vat = $calculatedFields['subtotal_before_vat'];
            $invoice->net_subtotal = $calculatedFields['net_subtotal'];
            $invoice->deposit_amount_before_vat = $calculatedFields['deposit_amount_before_vat'];

            // Reference for after-deposit invoices.
            $invoice->reference_invoice_id = $invoiceData['reference_invoice_id'] ?? null;
            $invoice->reference_invoice_number = $invoiceData['reference_invoice_number'] ?? null;

            // Payment.
            $invoice->payment_method = $invoiceData['payment_method'] ?? $quotation->payment_method ?? null;
            $invoice->payment_terms = $invoiceData['payment_terms'] ?? $quotation->payment_terms ?? null;
            $invoice->due_date = $invoiceData['due_date'] ?? $this->calculator->calculateDueDate($invoice->payment_terms);

            // Misc.
            $invoice->notes = $invoiceData['notes'] ?? $quotation->notes ?? null;
            $invoice->document_header_type = $invoiceData['document_header_type'] ?? $quotation->document_header_type ?? 'ต้นฉบับ';
            $invoice->signature_images = $invoiceData['signature_images'] ?? $quotation->signature_images ?? null;
            $invoice->sample_images = $invoiceData['sample_images'] ?? $quotation->sample_images ?? null;

            $invoice->status = 'draft';
            $invoice->paid_amount = 0;
            $invoice->created_by = $createdBy;
            $invoice->created_at = now();

            $invoice->save();

            // Items: prefer FE-edited list, otherwise copy from quotation.
            if (! empty($invoiceData['invoice_items']) && is_array($invoiceData['invoice_items'])) {
                $this->createInvoiceItemsFromArray($invoice->id, $invoiceData['invoice_items'], $createdBy);
            } else {
                $quotationItems = $quotation->items;
                if ($quotationItems->count() > 0) {
                    $this->createInvoiceItemsFromQuotation($invoice->id, $quotationItems, $createdBy);
                }
            }

            DocumentHistory::logAction(
                'invoice',
                $invoice->id,
                'create_from_quotation',
                $createdBy,
                "สร้างใบแจ้งหนี้จากใบเสนอราคา {$quotation->number} (ประเภท: {$invoiceType})"
            );

            DB::commit();

            return $invoice->load(['quotation', 'customer', 'items']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice\\CreationService::createFromQuotation error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Create an Invoice manually (no quotation source).
     *
     * @param  array<string, mixed>  $invoiceData
     */
    public function create(array $invoiceData, ?string $createdBy = null): Invoice
    {
        try {
            DB::beginTransaction();

            $invoice = new Invoice;
            $invoice->id = (string) Str::uuid();
            $invoice->company_id = $invoiceData['company_id']
                ?? (auth()->user()->company_id ?? optional(Company::where('is_active', true)->first())->id);

            $invoice->deposit_display_order = $invoiceData['deposit_display_order'] ?? 'before';
            $invoice->number = 'DRAFT-'.now()->format('YmdHis').'-'.substr($invoice->id, 0, 8);

            foreach ($invoiceData as $key => $value) {
                if ($invoice->isFillable($key)) {
                    $invoice->$key = $value;
                }
            }

            $invoice->status = 'draft';
            $invoice->created_by = $createdBy;
            $invoice->created_at = now();

            $invoice->save();

            DocumentHistory::logAction(
                'invoice',
                $invoice->id,
                'create',
                $createdBy,
                'สร้างใบแจ้งหนี้ใหม่'
            );

            DB::commit();

            return $invoice;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice\\CreationService::create error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Copy items 1-to-1 from a Quotation into a new Invoice.
     *
     * @param  \Illuminate\Database\Eloquent\Collection<int, \App\Models\Accounting\QuotationItem>  $quotationItems
     */
    private function createInvoiceItemsFromQuotation(string $invoiceId, $quotationItems, ?string $createdBy = null): void
    {
        try {
            foreach ($quotationItems as $index => $qItem) {
                $invoiceItem = new InvoiceItem;
                $invoiceItem->id = (string) Str::uuid();
                $invoiceItem->invoice_id = $invoiceId;
                $invoiceItem->quotation_item_id = $qItem->id;
                $invoiceItem->pricing_request_id = $qItem->pricing_request_id;
                $invoiceItem->item_name = $qItem->item_name;
                $invoiceItem->item_description = $qItem->item_description;
                $invoiceItem->sequence_order = $index + 1;
                $invoiceItem->pattern = $qItem->pattern;
                $invoiceItem->fabric_type = $qItem->fabric_type;
                $invoiceItem->color = $qItem->color;
                $invoiceItem->size = $qItem->size;
                $invoiceItem->unit_price = $qItem->unit_price;
                $invoiceItem->quantity = $qItem->quantity;
                $invoiceItem->unit = $qItem->unit ?? 'ชิ้น';
                $invoiceItem->discount_percentage = $qItem->discount_percentage ?? 0;
                $invoiceItem->discount_amount = $qItem->discount_amount ?? 0;
                $invoiceItem->item_images = is_string($qItem->item_images) ? json_decode($qItem->item_images, true) : $qItem->item_images;
                $invoiceItem->notes = $qItem->notes;
                $invoiceItem->status = 'draft';
                $invoiceItem->created_by = $createdBy;

                $invoiceItem->save();
            }
        } catch (\Exception $e) {
            Log::error('Invoice\\CreationService::createInvoiceItemsFromQuotation error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Create invoice items from a UI-supplied array (used when the FE edits
     * the quotation's items before creating the invoice).
     *
     * @param  array<int, array<string, mixed>>  $items
     */
    private function createInvoiceItemsFromArray(string $invoiceId, array $items, ?string $createdBy = null): void
    {
        try {
            foreach ($items as $index => $item) {
                $invoiceItem = new InvoiceItem;
                $invoiceItem->id = (string) Str::uuid();
                $invoiceItem->invoice_id = $invoiceId;
                $invoiceItem->quotation_item_id = $item['quotation_item_id'] ?? null;
                $invoiceItem->pricing_request_id = $item['pricing_request_id'] ?? null;
                $invoiceItem->item_name = $item['item_name'] ?? 'รายการที่ '.($index + 1);
                $invoiceItem->item_description = $item['item_description'] ?? null;
                $invoiceItem->sequence_order = $item['sequence_order'] ?? ($index + 1);
                $invoiceItem->pattern = $item['pattern'] ?? null;
                $invoiceItem->fabric_type = $item['fabric_type'] ?? null;
                $invoiceItem->color = $item['color'] ?? null;
                $invoiceItem->size = $item['size'] ?? null;
                $invoiceItem->unit_price = (float) ($item['unit_price'] ?? 0);
                $invoiceItem->quantity = (int) ($item['quantity'] ?? 0);
                $invoiceItem->unit = $item['unit'] ?? 'ชิ้น';
                $invoiceItem->discount_percentage = (float) ($item['discount_percentage'] ?? 0);
                $invoiceItem->discount_amount = (float) ($item['discount_amount'] ?? 0);
                $invoiceItem->item_images = isset($item['item_images']) && is_string($item['item_images'])
                    ? json_decode($item['item_images'], true)
                    : ($item['item_images'] ?? null);
                $invoiceItem->notes = $item['notes'] ?? null;
                $invoiceItem->status = 'draft';
                $invoiceItem->created_by = $createdBy;

                $invoiceItem->save();
            }
        } catch (\Exception $e) {
            Log::error('Invoice\\CreationService::createInvoiceItemsFromArray error: '.$e->getMessage());
            throw $e;
        }
    }
}
