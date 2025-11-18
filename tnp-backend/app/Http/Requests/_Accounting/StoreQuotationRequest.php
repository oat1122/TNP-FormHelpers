<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use App\Traits\QuotationItemRules;

class StoreQuotationRequest extends FormRequest
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
            'company_id' => 'nullable|string|exists:companies,id',
            'pricing_request_id' => 'nullable|string|exists:pricing_requests,pr_id',
            'customer_company' => 'required|string|max:255',
            'work_name' => 'required|string|max:100',
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
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string',
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
            'customer_company.required' => 'กรุณาระบุชื่อบริษัทลูกค้า',
            'work_name.required' => 'กรุณาระบุชื่องาน',
            'subtotal.required' => 'กรุณาระบุยอดรวมก่อนภาษี',
            'tax_amount.required' => 'กรุณาระบุยอดภาษี',
            'total_amount.required' => 'กรุณาระบุยอดรวมทั้งหมด',
        ];
    }
}
