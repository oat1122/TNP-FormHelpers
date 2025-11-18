<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use App\Traits\QuotationItemRules;

class UpdateQuotationRequest extends FormRequest
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
            'customer_company' => 'sometimes|string|max:255',
            'work_name' => 'sometimes|string|max:100',
            'subtotal' => 'sometimes|numeric|min:0',
            'tax_amount' => 'sometimes|numeric|min:0',
            'special_discount_percentage' => 'sometimes|numeric|min:0|max:100',
            'special_discount_amount' => 'sometimes|numeric|min:0',
            'has_withholding_tax' => 'sometimes|boolean',
            'withholding_tax_percentage' => 'sometimes|numeric|min:0|max:10',
            'withholding_tax_amount' => 'sometimes|numeric|min:0',
            'final_total_amount' => 'sometimes|numeric|min:0',
            'total_amount' => 'sometimes|numeric|min:0',
            'has_vat' => 'sometimes|boolean',
            'vat_percentage' => 'sometimes|numeric|min:0|max:100',
            'pricing_mode' => 'sometimes|in:net,vat_included',
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
}
