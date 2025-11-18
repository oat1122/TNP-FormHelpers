<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class CreateFromQuotationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'quotation_id' => 'required|string|exists:quotations,id',
            'type' => 'required|in:full_amount,remaining,deposit,partial',
            'custom_amount' => 'required_if:type,partial|numeric|min:0',
            'payment_terms' => 'nullable|string|max:100',
            'payment_method' => 'nullable|string|max:50',
            'due_date' => 'nullable|date',
            'custom_billing_address' => 'nullable|string|max:2000',
            'document_header_type' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:1000',
            'customer_data_source' => 'nullable|in:master,invoice',
            
            // Financial fields from frontend calculation
            'subtotal' => 'required|numeric|min:0',
            'subtotal_before_vat' => 'nullable|numeric|min:0',
            'special_discount_percentage' => 'nullable|numeric|min:0|max:100',
            'special_discount_amount' => 'nullable|numeric|min:0',
            'has_vat' => 'nullable|boolean',
            'vat_percentage' => 'nullable|numeric|min:0|max:100',
            'pricing_mode' => 'nullable|in:net,vat_included',
            'vat_amount' => 'nullable|numeric|min:0',
            'has_withholding_tax' => 'nullable|boolean',
            'withholding_tax_percentage' => 'nullable|numeric|min:0|max:100',
            'withholding_tax_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'final_total_amount' => 'required|numeric|min:0',
            
            // Deposit information
            'deposit_mode' => 'nullable|in:percentage,amount',
            'deposit_percentage' => 'nullable|numeric|min:0|max:100',
            'deposit_amount' => 'nullable|numeric|min:0',
            'deposit_amount_before_vat' => 'nullable|numeric|min:0',
            
            // Reference invoice information
            'reference_invoice_id' => 'nullable|string|exists:invoices,id',
            'reference_invoice_number' => 'nullable|string|max:50',
            
            // Images
            'signature_images' => 'nullable|array',
            'sample_images' => 'nullable|array',
            
            // Items (optional - can override quotation items if provided)
            'invoice_items' => 'nullable|array',
            'invoice_items.*.pricing_request_id' => 'nullable|string',
            'invoice_items.*.quotation_item_id' => 'nullable|string',
            'invoice_items.*.item_name' => 'nullable|string|max:255',
            'invoice_items.*.item_description' => 'nullable|string|max:1000',
            'invoice_items.*.pattern' => 'nullable|string|max:255',
            'invoice_items.*.fabric_type' => 'nullable|string|max:255',
            'invoice_items.*.color' => 'nullable|string|max:255',
            'invoice_items.*.size' => 'nullable|string|max:100',
            'invoice_items.*.quantity' => 'nullable|integer|min:0',
            'invoice_items.*.unit_price' => 'nullable|numeric|min:0',
            'invoice_items.*.unit' => 'nullable|string|max:50',
            'invoice_items.*.notes' => 'nullable|string|max:1000',
            'invoice_items.*.sequence_order' => 'nullable|integer|min:0',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'quotation_id.required' => 'กรุณาระบุใบเสนอราคา',
            'quotation_id.exists' => 'ไม่พบใบเสนอราคาที่เลือก',
            'type.required' => 'กรุณาเลือกประเภทใบแจ้งหนี้',
            'type.in' => 'ประเภทใบแจ้งหนี้ไม่ถูกต้อง',
            'custom_amount.required_if' => 'กรุณาระบุจำนวนเงินสำหรับใบแจ้งหนี้บางส่วน',
            'subtotal.required' => 'กรุณาระบุยอดรวมย่อย',
            'total_amount.required' => 'กรุณาระบุยอดรวมทั้งหมด',
            'final_total_amount.required' => 'กรุณาระบุยอดรวมสุทธิ',
        ];
    }
}
