<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class MarkQuotationCompletedRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('quotation.markCompleted') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'completion_notes' => 'nullable|string|max:1000',
            'customer_response' => 'nullable|string|max:2000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'completion_notes.string' => 'หมายเหตุการเสร็จสิ้นต้องเป็นข้อความ',
            'completion_notes.max' => 'หมายเหตุการเสร็จสิ้นยาวเกิน 1000 ตัวอักษร',
            'customer_response.string' => 'การตอบกลับลูกค้าต้องเป็นข้อความ',
            'customer_response.max' => 'การตอบกลับลูกค้ายาวเกิน 2000 ตัวอักษร',
        ];
    }
}
