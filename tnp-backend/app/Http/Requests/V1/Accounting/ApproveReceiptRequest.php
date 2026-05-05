<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class ApproveReceiptRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Restricted to manager role (admin bypasses via Gate::before).
     * Note: legacy controller used 'account' which never existed in users.role
     * enum — Phase 3 D1 treats it as a typo for 'manager'.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('receipt.approve') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'notes' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'notes.string' => 'หมายเหตุต้องเป็นข้อความ',
            'notes.max' => 'หมายเหตุต้องไม่เกิน 1000 ตัวอักษร',
        ];
    }
}
