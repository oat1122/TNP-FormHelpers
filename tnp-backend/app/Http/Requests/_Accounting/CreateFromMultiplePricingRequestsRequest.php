<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use App\Traits\QuotationItemRules;

class CreateFromMultiplePricingRequestsRequest extends FormRequest
{
    use QuotationItemRules;

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
        $baseRules = [
            'pricing_request_ids' => 'required|array|min:1',
            'pricing_request_ids.*' => 'required|string|exists:pricing_requests,pr_id',
            'customer_id' => 'required|string|exists:master_customers,cus_id',
            'additional_notes' => 'nullable|string',
            'subtotal' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'special_discount_percentage' => 'nullable|numeric|min:0|max:100',
            'special_discount_amount' => 'nullable|numeric|min:0',
            'has_withholding_tax' => 'nullable|boolean',
            'withholding_tax_percentage' => 'nullable|numeric|min:0|max:10',
            'withholding_tax_amount' => 'nullable|numeric|min:0',
            'final_total_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'has_vat' => 'nullable|boolean',
            'vat_percentage' => 'nullable|numeric|min:0|max:100',
            'pricing_mode' => 'nullable|in:net,vat_included',
            'deposit_percentage' => 'nullable|numeric|min:0|max:100',
            'deposit_mode' => 'nullable|in:percentage,amount',
            'deposit_amount' => 'nullable|numeric|min:0',
            'payment_terms' => 'nullable|string|max:50',
            'due_date' => 'nullable|date',
            'sample_images' => 'nullable|array',
        ];

        return static::mergeItemRules($baseRules);
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'pricing_request_ids.required' => 'กรุณาเลือกใบขอเสนอราคาอย่างน้อย 1 รายการ',
            'pricing_request_ids.min' => 'กรุณาเลือกใบขอเสนอราคาอย่างน้อย 1 รายการ',
            'customer_id.required' => 'กรุณาระบุลูกค้า',
            'customer_id.exists' => 'ไม่พบข้อมูลลูกค้าที่ระบุ',
        ];
    }
}
