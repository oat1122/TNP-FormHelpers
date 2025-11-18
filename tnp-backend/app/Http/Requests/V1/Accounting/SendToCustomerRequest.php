<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class SendToCustomerRequest extends FormRequest
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
            'delivery_method' => 'required|string|max:50',
            'recipient_email' => 'nullable|email|max:255',
            'notes' => 'nullable|string|max:1000'
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'delivery_method.required' => 'กรุณาระบุวิธีการส่ง',
            'recipient_email.email' => 'รูปแบบอีเมลไม่ถูกต้อง',
        ];
    }
}
