<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
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
            'company_id' => 'nullable|string|exists:companies,id',
            'customer_company' => 'required|string|max:255',
            'customer_tax_id' => 'required|string|max:13',
            'customer_address' => 'required|string|max:500',
            'work_name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'subtotal' => 'required|numeric|min:0',
            'subtotal_before_vat' => 'nullable|numeric|min:0',
            'tax_amount' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'has_vat' => 'nullable|boolean',
            'vat_percentage' => 'nullable|numeric|min:0|max:100',
            'pricing_mode' => 'nullable|in:net,vat_included',
            'payment_terms' => 'nullable|string|max:100',
            
            // Deposit fields
            'deposit_amount_before_vat' => 'nullable|numeric|min:0',
            
            // Reference invoice information
            'reference_invoice_id' => 'nullable|string|exists:invoices,id',
            'reference_invoice_number' => 'nullable|string|max:50'
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'company_id.exists' => 'บริษัทที่เลือกไม่ถูกต้อง',
            'customer_company.required' => 'กรุณาระบุชื่อบริษัทลูกค้า',
            'customer_tax_id.required' => 'กรุณาระบุเลขประจำตัวผู้เสียภาษี',
            'customer_address.required' => 'กรุณาระบุที่อยู่ลูกค้า',
            'work_name.required' => 'กรุณาระบุชื่องาน',
            'quantity.required' => 'กรุณาระบุจำนวน',
            'subtotal.required' => 'กรุณาระบุยอดรวมย่อย',
            'tax_amount.required' => 'กรุณาระบุยอดภาษี',
            'total_amount.required' => 'กรุณาระบุยอดรวมทั้งหมด',
        ];
    }
}
