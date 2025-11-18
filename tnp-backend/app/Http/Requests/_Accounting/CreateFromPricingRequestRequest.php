<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class CreateFromPricingRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'pricing_request_id' => 'required|string|exists:pricing_requests,pr_id',
            'subtotal' => 'required|numeric|min:0',
            'tax_amount' => 'required|numeric|min:0',
            'special_discount_percentage' => 'nullable|numeric|min:0|max:100',
            'special_discount_amount' => 'nullable|numeric|min:0',
            'has_withholding_tax' => 'nullable|boolean',
            'withholding_tax_percentage' => 'nullable|numeric|min:0|max:10',
            'withholding_tax_amount' => 'nullable|numeric|min:0',
            'final_total_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'has_vat' => 'nullable|boolean',
            'vat_percentage' => 'nullable|numeric|min:0|max:100',
            'pricing_mode' => 'nullable|in:net,vat_included',
            'deposit_percentage' => 'nullable|numeric|min:0|max:100',
            'deposit_mode' => 'nullable|in:percentage,amount',
            'deposit_amount' => 'nullable|numeric|min:0',
            'payment_terms' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'pricing_request_id.required' => 'กรุณาระบุ ID ของใบขอเสนอราคา',
            'pricing_request_id.exists' => 'ไม่พบใบขอเสนอราคาที่ระบุ',
            'subtotal.required' => 'กรุณาระบุยอดรวมก่อนภาษี',
            'tax_amount.required' => 'กรุณาระบุยอดภาษี',
            'total_amount.required' => 'กรุณาระบุยอดรวมทั้งหมด',
        ];
    }
}
