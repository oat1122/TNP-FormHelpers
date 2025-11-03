<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWorksheetRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'work_name' => ['required'],
            'total_quantity' => ['required'],
            'due_date' => ['required'],
            'customer_name' => ['required'],
            'fabric_name' => ['required'],
            'fabric_color' => ['required'],
            'fabric_factory' => ['required'],
            'pattern_name' => ['required'],
            
            // Polo shirt validation
            'type_shirt' => ['required', 'string'],
            'polo_embroider' => ['nullable', 'array', 'required_if:type_shirt,polo-shirt'],
            'polo_embroider.*.embroider_position' => ['required', 'string'],
            'polo_embroider.*.embroider_size' => ['nullable', 'string'],
        ];
    }
}
