<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDepositModeRequest extends FormRequest
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
            'deposit_display_order' => 'required|string|in:before,after'
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'deposit_display_order.required' => 'กรุณาระบุลำดับการแสดงผล',
            'deposit_display_order.in' => 'ลำดับการแสดงผลไม่ถูกต้อง',
        ];
    }
}
