<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Accounting\Quotation;

class UpdateQuotationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Handle authorization in middleware/policies
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_id' => 'sometimes|string|exists:master_customers,cus_id',
            'payment_terms' => 'nullable|string|max:255',
            'deposit_amount' => 'nullable|numeric|min:0',
            'valid_until' => 'nullable|date|after:today',
            'remarks' => 'nullable|string',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            
            // Items validation
            'items' => 'sometimes|array|min:1',
            'items.*.product_id' => 'nullable|exists:master_product_categories,mpc_id',
            'items.*.item_name' => 'required_with:items|string|max:255',
            'items.*.item_description' => 'nullable|string',
            'items.*.quantity' => 'required_with:items|numeric|min:0.01',
            'items.*.unit' => 'nullable|string|max:50',
            'items.*.unit_price' => 'required_with:items|numeric|min:0',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.notes' => 'nullable|string'
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'customer_id.exists' => 'Selected customer does not exist',
            'items.min' => 'At least one item is required when updating items',
            'items.*.item_name.required_with' => 'Item name is required for all items',
            'items.*.quantity.required_with' => 'Quantity is required for all items',
            'items.*.quantity.min' => 'Quantity must be greater than 0',
            'items.*.unit_price.required_with' => 'Unit price is required for all items',
            'items.*.unit_price.min' => 'Unit price must be 0 or greater',
            'valid_until.after' => 'Valid until date must be in the future',
            'tax_rate.max' => 'Tax rate cannot exceed 100%',
            'deposit_amount.min' => 'Deposit amount must be 0 or greater'
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Clean up items data if provided
        if ($this->has('items')) {
            $items = collect($this->input('items'))->map(function ($item) {
                // Set default unit if not provided
                if (empty($item['unit'])) {
                    $item['unit'] = 'ชิ้น';
                }

                // Calculate discount amount from percentage if provided
                if (!empty($item['discount_percentage']) && empty($item['discount_amount'])) {
                    $subtotal = ($item['quantity'] ?? 0) * ($item['unit_price'] ?? 0);
                    $item['discount_amount'] = $subtotal * ($item['discount_percentage'] / 100);
                }

                return $item;
            })->toArray();

            $this->merge(['items' => $items]);
        }
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'customer_id' => 'customer',
            'payment_terms' => 'payment terms',
            'deposit_amount' => 'deposit amount',
            'valid_until' => 'valid until date',
            'tax_rate' => 'tax rate',
            'items.*.item_name' => 'item name',
            'items.*.quantity' => 'quantity',
            'items.*.unit_price' => 'unit price',
            'items.*.discount_percentage' => 'discount percentage',
            'items.*.discount_amount' => 'discount amount'
        ];
    }
}