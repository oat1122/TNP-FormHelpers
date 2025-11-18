<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class RevertToDraftRequest extends FormRequest
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
     */
    public function rules(): array
    {
        return [
            'side' => 'nullable|in:before,after',
            'reason' => 'nullable|string|max:1000'
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'side.in' => 'ค่า side ต้องเป็น before หรือ after เท่านั้น',
            'reason.max' => 'เหตุผลต้องไม่เกิน 1000 ตัวอักษร',
        ];
    }
}
