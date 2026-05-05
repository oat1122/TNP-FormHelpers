<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class CreateReceiptFromPaymentRequest extends FormRequest
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
     * - `amount`/`total_amount`/`payment_amount` are kept as a 3-way alias trio
     *   (`required_without_all`) for legacy FE compat — service resolves which
     *   one is set.
     * - `type`/`receipt_type` are aliases (Receipt model `getReceiptTypeAttribute`).
     */
    public function rules(): array
    {
        return [
            'invoice_id' => 'required|string|exists:invoices,id',
            'amount' => 'required_without_all:total_amount,payment_amount|numeric|min:0.01',
            'total_amount' => 'required_without_all:amount,payment_amount|numeric|min:0.01',
            'payment_amount' => 'required_without_all:amount,total_amount|numeric|min:0.01',
            'payment_date' => 'nullable|date',
            'payment_method' => 'required|in:cash,transfer,check,credit_card',
            'type' => 'nullable|in:receipt,tax_invoice,full_tax_invoice',
            'receipt_type' => 'nullable|in:receipt,tax_invoice,full_tax_invoice',
            'reference_number' => 'nullable|string|max:100',
            'payment_reference' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'invoice_id.required' => 'กรุณาระบุใบแจ้งหนี้',
            'invoice_id.exists' => 'ไม่พบใบแจ้งหนี้ที่ระบุ',
            'amount.required_without_all' => 'กรุณาระบุจำนวนเงิน',
            'amount.numeric' => 'จำนวนเงินต้องเป็นตัวเลข',
            'amount.min' => 'จำนวนเงินต้องมากกว่า 0',
            'total_amount.numeric' => 'ยอดรวมต้องเป็นตัวเลข',
            'total_amount.min' => 'ยอดรวมต้องมากกว่า 0',
            'payment_amount.numeric' => 'ยอดชำระต้องเป็นตัวเลข',
            'payment_amount.min' => 'ยอดชำระต้องมากกว่า 0',
            'payment_date.date' => 'วันที่ชำระไม่ถูกต้อง',
            'payment_method.required' => 'กรุณาระบุวิธีการชำระเงิน',
            'payment_method.in' => 'วิธีการชำระเงินไม่ถูกต้อง',
            'type.in' => 'ประเภทใบเสร็จไม่ถูกต้อง',
            'receipt_type.in' => 'ประเภทใบเสร็จไม่ถูกต้อง',
            'reference_number.max' => 'เลขอ้างอิงยาวเกิน 100 ตัวอักษร',
            'payment_reference.max' => 'เลขอ้างอิงการชำระยาวเกิน 100 ตัวอักษร',
            'bank_name.max' => 'ชื่อธนาคารยาวเกิน 100 ตัวอักษร',
            'notes.max' => 'หมายเหตุยาวเกิน 1000 ตัวอักษร',
        ];
    }
}
