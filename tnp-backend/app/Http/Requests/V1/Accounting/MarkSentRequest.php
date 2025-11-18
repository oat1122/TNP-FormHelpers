<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class MarkSentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'delivery_method' => 'required|in:email,hand_delivery,postal,courier',
            'delivery_notes' => 'nullable|string|max:1000',
            'recipient_name' => 'nullable|string|max:255',
            'delivery_date' => 'nullable|date',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'delivery_method.required' => 'กรุณาเลือกวิธีการส่ง',
            'delivery_method.in' => 'วิธีการส่งไม่ถูกต้อง',
        ];
    }
}
