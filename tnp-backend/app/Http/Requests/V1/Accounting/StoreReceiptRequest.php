<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class StoreReceiptRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('receipt.create') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * Note:
     * - `total_amount`/`payment_amount` are kept as a 2-way alias
     *   (`required_without`) for legacy FE compat.
     * - `type`/`receipt_type` are aliases (Receipt model `getReceiptTypeAttribute`).
     */
    public function rules(): array
    {
        return [
            'company_id' => 'nullable|string|exists:companies,id',
            'customer_company' => 'required|string|max:255',
            'customer_address' => 'required|string|max:500',
            'work_name' => 'required|string|max:255',
            'total_amount' => 'required_without:payment_amount|numeric|min:0.01',
            'payment_amount' => 'required_without:total_amount|numeric|min:0.01',
            'payment_date' => 'nullable|date',
            'payment_method' => 'required|in:cash,transfer,check,credit_card',
            'type' => 'required_without:receipt_type|in:receipt,tax_invoice,full_tax_invoice',
            'receipt_type' => 'required_without:type|in:receipt,tax_invoice,full_tax_invoice',
            'subtotal' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'vat_amount' => 'nullable|numeric|min:0',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'company_id.exists' => 'ไม่พบบริษัทที่ระบุ',
            'customer_company.required' => 'กรุณาระบุชื่อบริษัทลูกค้า',
            'customer_company.max' => 'ชื่อบริษัทลูกค้ายาวเกิน 255 ตัวอักษร',
            'customer_address.required' => 'กรุณาระบุที่อยู่ลูกค้า',
            'customer_address.max' => 'ที่อยู่ลูกค้ายาวเกิน 500 ตัวอักษร',
            'work_name.required' => 'กรุณาระบุชื่องาน',
            'work_name.max' => 'ชื่องานยาวเกิน 255 ตัวอักษร',
            'total_amount.required_without' => 'กรุณาระบุยอดรวม',
            'total_amount.numeric' => 'ยอดรวมต้องเป็นตัวเลข',
            'total_amount.min' => 'ยอดรวมต้องมากกว่า 0',
            'payment_amount.required_without' => 'กรุณาระบุยอดชำระ',
            'payment_amount.numeric' => 'ยอดชำระต้องเป็นตัวเลข',
            'payment_amount.min' => 'ยอดชำระต้องมากกว่า 0',
            'payment_date.date' => 'วันที่ชำระไม่ถูกต้อง',
            'payment_method.required' => 'กรุณาระบุวิธีการชำระเงิน',
            'payment_method.in' => 'วิธีการชำระเงินไม่ถูกต้อง',
            'type.required_without' => 'กรุณาระบุประเภทใบเสร็จ',
            'type.in' => 'ประเภทใบเสร็จไม่ถูกต้อง',
            'receipt_type.required_without' => 'กรุณาระบุประเภทใบเสร็จ',
            'receipt_type.in' => 'ประเภทใบเสร็จไม่ถูกต้อง',
            'subtotal.numeric' => 'ยอดก่อนภาษีต้องเป็นตัวเลข',
            'tax_amount.numeric' => 'ภาษีต้องเป็นตัวเลข',
            'vat_amount.numeric' => 'ภาษีมูลค่าเพิ่มต้องเป็นตัวเลข',
        ];
    }
}
