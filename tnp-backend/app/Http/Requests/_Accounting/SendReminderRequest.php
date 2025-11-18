<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class SendReminderRequest extends FormRequest
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
            'recipient_email' => 'required|email|max:255',
            'notes' => 'nullable|string|max:1000'
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'recipient_email.required' => 'กรุณาระบุอีเมลผู้รับ',
            'recipient_email.email' => 'รูปแบบอีเมลไม่ถูกต้อง',
        ];
    }
}
