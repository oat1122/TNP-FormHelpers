<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class CreateQuotationRequest extends FormRequest
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
            'pricing_request_id' => 'nullable|string',
            'customer_id' => 'required|string|exists:master_customers,cus_id',
            'payment_terms' => 'nullable|string|max:255',
            'deposit_amount' => 'nullable|numeric|min:0',
            'valid_until' => 'nullable|date|after:today',
            'remarks' => 'nullable|string',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            
            // Items validation
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:master_product_categories,mpc_id',
            'items.*.product_name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit' => 'nullable|string|max:50',
            'items.*.unit_price' => 'required|numeric|min:0',
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
            'customer_id.required' => 'Customer is required',
            'customer_id.exists' => 'Selected customer does not exist',
            'items.required' => 'At least one item is required',
            'items.min' => 'At least one item is required',
            'items.*.product_name.required' => 'Product name is required for all items',
            'items.*.quantity.required' => 'Quantity is required for all items',
            'items.*.quantity.min' => 'Quantity must be greater than 0',
            'items.*.unit_price.required' => 'Unit price is required for all items',
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
        // Set default tax rate if not provided
        if (!$this->has('tax_rate')) {
            $this->merge([
                'tax_rate' => config('accounting.default_vat_rate', 7)
            ]);
        }

        // Set default valid until date if not provided
        if (!$this->has('valid_until')) {
            $this->merge([
                'valid_until' => now()->addDays(30)->format('Y-m-d')
            ]);
        }

        // Clean up items data
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
            'pricing_request_id' => 'pricing request',
            'payment_terms' => 'payment terms',
            'deposit_amount' => 'deposit amount',
            'valid_until' => 'valid until date',
            'tax_rate' => 'tax rate',
            'items.*.product_name' => 'product name',
            'items.*.quantity' => 'quantity',
            'items.*.unit_price' => 'unit price',
            'items.*.discount_percentage' => 'discount percentage',
            'items.*.discount_amount' => 'discount amount'
        ];
    }
}
