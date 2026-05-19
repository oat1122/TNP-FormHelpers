<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInvoiceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('invoice.update') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            // Company selection (can be changed before approval)
            'company_id' => 'sometimes|nullable|string|exists:companies,id',

            // Customer override fields (nullable when not overriding)
            'customer_company' => 'sometimes|nullable|string|max:255',
            'customer_tax_id' => 'sometimes|nullable|string|max:13',
            'customer_address' => 'sometimes|nullable|string|max:2000',
            'customer_zip_code' => 'sometimes|nullable|string|max:10',
            'customer_tel_1' => 'sometimes|nullable|string|max:50',
            'customer_email' => 'sometimes|nullable|string|max:255',
            'customer_firstname' => 'sometimes|nullable|string|max:100',
            'customer_lastname' => 'sometimes|nullable|string|max:100',
            'customer_data_source' => 'sometimes|in:master,invoice',

            // Basic invoice info
            'work_name' => 'sometimes|nullable|string|max:255',
            'quantity' => 'sometimes|integer|min:1',
            // SECURITY: `status` removed — status transitions must go through Invoice\StatusService
            //   (submit/approve/reject/markPaid). Accepting client-set status bypasses the
            //   state machine + audit log.
            'type' => 'sometimes|in:full_amount,remaining,deposit,partial',

            // Financial fields
            'subtotal' => 'sometimes|numeric|min:0',
            'subtotal_before_vat' => 'sometimes|nullable|numeric|min:0',
            'special_discount_percentage' => 'sometimes|numeric|min:0|max:100',
            'special_discount_amount' => 'sometimes|numeric|min:0',
            'has_vat' => 'sometimes|boolean',
            'vat_percentage' => 'sometimes|numeric|min:0|max:100',
            'pricing_mode' => 'sometimes|in:net,vat_included',
            'vat_amount' => 'sometimes|numeric|min:0',
            'tax_amount' => 'sometimes|numeric|min:0', // alias for FE compatibility
            'has_withholding_tax' => 'sometimes|boolean',
            'withholding_tax_percentage' => 'sometimes|numeric|min:0|max:100',
            'withholding_tax_amount' => 'sometimes|numeric|min:0',
            'total_amount' => 'sometimes|numeric|min:0',
            'final_total_amount' => 'sometimes|numeric|min:0',
            'deposit_mode' => 'sometimes|in:percentage,amount',
            'deposit_percentage' => 'sometimes|numeric|min:0|max:100',
            'deposit_amount' => 'sometimes|numeric|min:0',
            'deposit_amount_before_vat' => 'sometimes|nullable|numeric|min:0',

            // Reference invoice information
            'reference_invoice_id' => 'sometimes|nullable|string|exists:invoices,id',
            'reference_invoice_number' => 'sometimes|nullable|string|max:50',

            // Payment / terms
            'due_date' => 'sometimes|date',
            'payment_method' => 'sometimes|nullable|string|max:50',
            'payment_terms' => 'nullable|string|max:100',
            'document_header_type' => 'sometimes|nullable|string|max:50',
            'notes' => 'sometimes|nullable|string|max:2000',

            // Per-side override fields (มัดจำก่อน / มัดจำหลัง) — Phase 1 of invoice-side-edit plan
            // null = fall back to legacy atomic value
            'due_date_before' => 'sometimes|nullable|date',
            'due_date_after' => 'sometimes|nullable|date',
            // SECURITY: `paid_amount_before` / `paid_amount_after` removed — payment writes
            //   must go through Invoice\StatusService::recordPayment (atomic + history log).
            //   Accepting client-set paid amount allows zeroing receivables.
            'notes_before' => 'sometimes|nullable|string|max:5000',
            'notes_after' => 'sometimes|nullable|string|max:5000',

            // Items array — consumed by ManagementService::updateInvoiceItems().
            // Structure mirrors FE editableItems (group with optional sizeRows).
            // Validation is intentionally loose: the service builds InvoiceItem
            // rows defensively (?? null / (int) / (float)) and FE owns the schema.
            'items' => 'sometimes|array',
            'items.*' => 'array',
            'items.*.name' => 'sometimes|nullable|string|max:255',
            'items.*.pattern' => 'sometimes|nullable|string|max:255',
            'items.*.fabric_type' => 'sometimes|nullable|string|max:255',
            'items.*.fabricType' => 'sometimes|nullable|string|max:255',
            'items.*.color' => 'sometimes|nullable|string|max:255',
            'items.*.size' => 'sometimes|nullable|string|max:255',
            'items.*.unit' => 'sometimes|nullable|string|max:50',
            'items.*.quantity' => 'sometimes|nullable|integer|min:0',
            'items.*.unit_price' => 'sometimes|nullable|numeric|min:0',
            'items.*.unitPrice' => 'sometimes|nullable|numeric|min:0',
            'items.*.discount_percentage' => 'sometimes|nullable|numeric|min:0|max:100',
            'items.*.discount_amount' => 'sometimes|nullable|numeric|min:0',
            'items.*.item_description' => 'sometimes|nullable|string|max:2000',
            'items.*.quotation_item_id' => 'sometimes|nullable|string',
            'items.*.pricing_request_id' => 'sometimes|nullable|string',
            'items.*.status' => 'sometimes|nullable|string|max:50',
            'items.*.notes' => 'sometimes|nullable|string|max:2000',
            'items.*.sizeRows' => 'sometimes|array',
            'items.*.sizeRows.*' => 'array',
            'items.*.sizeRows.*.size' => 'sometimes|nullable|string|max:255',
            'items.*.sizeRows.*.quantity' => 'sometimes|nullable|integer|min:0',
            'items.*.sizeRows.*.unitPrice' => 'sometimes|nullable|numeric|min:0',
            'items.*.sizeRows.*.notes' => 'sometimes|nullable|string|max:2000',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'company_id.exists' => 'บริษัทที่เลือกไม่ถูกต้อง',
            'customer_data_source.in' => 'แหล่งข้อมูลลูกค้าไม่ถูกต้อง',
            'type.in' => 'ประเภทใบแจ้งหนี้ไม่ถูกต้อง',
            'pricing_mode.in' => 'รูปแบบการคำนวณราคาไม่ถูกต้อง',
            'deposit_mode.in' => 'รูปแบบมัดจำไม่ถูกต้อง',
        ];
    }
}
