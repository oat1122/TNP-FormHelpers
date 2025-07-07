<?php

namespace App\Http\Requests\MaxSupply;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaxSupplyRequest extends FormRequest
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
        return [
            'worksheet_id' => 'required|string|max:255',
            'production_code' => 'nullable|string|max:255|unique:max_supplies,production_code',
            'customer_name' => 'required|string|max:255',
            'product_name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'print_points' => 'nullable|numeric|min:0',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'nullable|in:pending,in_progress,completed,cancelled',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'notes' => 'nullable|string|max:1000',
            'additional_data' => 'nullable|array',
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
            'start_date.after_or_equal' => 'Start date must be today or later',
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
            'created_by' => auth()->id(),
            'status' => $this->status ?? 'pending',
            'priority' => $this->priority ?? 'medium',
        ]);
    }
}
