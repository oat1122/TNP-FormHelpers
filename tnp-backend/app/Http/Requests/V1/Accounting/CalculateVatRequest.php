<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class CalculateVatRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('receipt.calculateVat') ?? false;
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
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required_without:receipt_type|in:receipt,tax_invoice,full_tax_invoice',
            'receipt_type' => 'required_without:type|in:receipt,tax_invoice,full_tax_invoice',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'amount.required' => 'กรุณาระบุจำนวนเงิน',
            'amount.numeric' => 'จำนวนเงินต้องเป็นตัวเลข',
            'amount.min' => 'จำนวนเงินต้องมากกว่า 0',
            'type.required_without' => 'กรุณาระบุประเภทใบเสร็จ',
            'type.in' => 'ประเภทใบเสร็จไม่ถูกต้อง',
            'receipt_type.required_without' => 'กรุณาระบุประเภทใบเสร็จ',
            'receipt_type.in' => 'ประเภทใบเสร็จไม่ถูกต้อง',
        ];
    }
}
