<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use App\Traits\QuotationItemRules;

class CreateStandaloneQuotationRequest extends FormRequest
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
            'company_id' => 'required|string|exists:companies,id',
            'customer_id' => 'required|string|exists:master_customers,cus_id',
            'work_name' => 'required|string|max:100',
            'primary_pricing_request_id' => 'nullable|string',
            'primary_pricing_request_ids' => 'nullable|array',
            'special_discount_percentage' => 'nullable|numeric|min:0|max:100',
            'special_discount_amount' => 'nullable|numeric|min:0',
            'has_vat' => 'nullable|boolean',
            'vat_percentage' => 'nullable|numeric|min:0|max:100',
            'has_withholding_tax' => 'nullable|boolean',
            'withholding_tax_percentage' => 'nullable|numeric|min:0|max:10',
            'deposit_mode' => 'nullable|in:percentage,amount',
            'deposit_percentage' => 'nullable|numeric|min:0|max:100',
            'deposit_amount' => 'nullable|numeric|min:0',
            'payment_terms' => 'nullable|string|max:50',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'document_header_type' => 'nullable|string|max:50',
            'sample_images' => 'nullable|array',
        ];

        // Override items validation to make it required for standalone
        $itemRules = static::itemRules();
        $itemRules['items'] = 'required|array|min:1';

        return array_merge($baseRules, $itemRules);
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'company_id.required' => 'กรุณาเลือกบริษัท',
            'customer_id.required' => 'กรุณาเลือกลูกค้า',
            'work_name.required' => 'กรุณาระบุชื่องาน',
            'items.required' => 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ',
            'items.min' => 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ',
        ];
    }
}
