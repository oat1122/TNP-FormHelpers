<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInvoiceRequest extends FormRequest
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
            'status' => 'sometimes|in:draft,pending,pending_after,approved,sent,partial_paid,fully_paid,overdue',
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
            'status.in' => 'สถานะไม่ถูกต้อง',
            'type.in' => 'ประเภทใบแจ้งหนี้ไม่ถูกต้อง',
            'pricing_mode.in' => 'รูปแบบการคำนวณราคาไม่ถูกต้อง',
            'deposit_mode.in' => 'รูปแบบมัดจำไม่ถูกต้อง',
        ];
    }
}
