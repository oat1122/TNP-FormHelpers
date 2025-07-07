<?php

namespace App\Http\Requests\MaxSupply;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMaxSupplyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $maxSupplyId = $this->route('maxSupply')?->id ?? $this->route('max_supply');
        
        return [
            'worksheet_id' => 'sometimes|required|string|max:255',
            'production_code' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('max_supplies', 'production_code')->ignore($maxSupplyId)
            ],
            'customer_name' => 'sometimes|required|string|max:255',
            'product_name' => 'sometimes|required|string|max:255',
            'quantity' => 'sometimes|required|integer|min:1',
            'print_points' => 'sometimes|nullable|numeric|min:0',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after_or_equal:start_date',
            'status' => 'sometimes|nullable|in:pending,in_progress,completed,cancelled',
            'priority' => 'sometimes|nullable|in:low,medium,high,urgent',
            'notes' => 'sometimes|nullable|string|max:1000',
            'additional_data' => 'sometimes|nullable|array',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'worksheet_id.required' => 'Worksheet ID is required',
            'customer_name.required' => 'Customer name is required',
            'product_name.required' => 'Product name is required',
            'quantity.required' => 'Quantity is required',
            'quantity.min' => 'Quantity must be at least 1',
            'start_date.required' => 'Start date is required',
            'end_date.required' => 'End date is required',
            'end_date.after_or_equal' => 'End date must be equal to or after start date',
            'production_code.unique' => 'Production code already exists',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'updated_by' => auth()->id(),
        ]);
    }
}
