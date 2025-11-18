<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Class BulkAutofillRequest
 * 
 * Validation request for bulk pricing request autofill
 * POST /api/v1/pricing-requests/bulk-autofill
 */
class BulkAutofillRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'ids' => 'required|array|min:1|max:50', // จำกัดไม่เกิน 50 รายการต่อครั้ง
            'ids.*' => 'required|integer'
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ids.required' => 'กรุณาระบุ IDs ของ Pricing Request',
            'ids.array' => 'IDs ต้องเป็น array',
            'ids.min' => 'ต้องระบุอย่างน้อย 1 รายการ',
            'ids.max' => 'สามารถดึงข้อมูลได้สูงสุด 50 รายการต่อครั้ง',
            'ids.*.integer' => 'ID ต้องเป็นตัวเลขจำนวนเต็ม'
        ];
    }
}
