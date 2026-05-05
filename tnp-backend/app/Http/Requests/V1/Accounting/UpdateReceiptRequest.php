<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReceiptRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('receipt.update') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * Note: `type` and `receipt_type` are kept as aliases for legacy FE compat
     * (Receipt model exposes `getReceiptTypeAttribute`).
     */
    public function rules(): array
    {
        return [
            'customer_company' => 'sometimes|string|max:255',
            'customer_address' => 'sometimes|string|max:500',
            'work_name' => 'sometimes|string|max:255',
            'payment_amount' => 'sometimes|numeric|min:0.01',
            'total_amount' => 'sometimes|numeric|min:0.01',
            'payment_date' => 'sometimes|date',
            'payment_method' => 'sometimes|in:cash,transfer,check,credit_card',
            'type' => 'sometimes|in:receipt,tax_invoice,full_tax_invoice',
            'receipt_type' => 'sometimes|in:receipt,tax_invoice,full_tax_invoice',
            'subtotal' => 'sometimes|numeric|min:0',
            'tax_amount' => 'sometimes|numeric|min:0',
            'vat_amount' => 'sometimes|numeric|min:0',
            'payment_reference' => 'sometimes|nullable|string|max:100',
            'reference_number' => 'sometimes|nullable|string|max:100',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'customer_company.string' => 'ชื่อบริษัทลูกค้าต้องเป็นข้อความ',
            'customer_company.max' => 'ชื่อบริษัทลูกค้ายาวเกิน 255 ตัวอักษร',
            'customer_address.max' => 'ที่อยู่ลูกค้ายาวเกิน 500 ตัวอักษร',
            'work_name.max' => 'ชื่องานยาวเกิน 255 ตัวอักษร',
            'payment_amount.numeric' => 'ยอดชำระต้องเป็นตัวเลข',
            'payment_amount.min' => 'ยอดชำระต้องมากกว่า 0',
            'total_amount.numeric' => 'ยอดรวมต้องเป็นตัวเลข',
            'total_amount.min' => 'ยอดรวมต้องมากกว่า 0',
            'payment_date.date' => 'วันที่ชำระไม่ถูกต้อง',
            'payment_method.in' => 'วิธีการชำระเงินไม่ถูกต้อง',
            'type.in' => 'ประเภทใบเสร็จไม่ถูกต้อง',
            'receipt_type.in' => 'ประเภทใบเสร็จไม่ถูกต้อง',
            'subtotal.numeric' => 'ยอดก่อนภาษีต้องเป็นตัวเลข',
            'tax_amount.numeric' => 'ภาษีต้องเป็นตัวเลข',
            'vat_amount.numeric' => 'ภาษีมูลค่าเพิ่มต้องเป็นตัวเลข',
            'payment_reference.max' => 'เลขอ้างอิงการชำระยาวเกิน 100 ตัวอักษร',
            'reference_number.max' => 'เลขอ้างอิงยาวเกิน 100 ตัวอักษร',
        ];
    }
}
