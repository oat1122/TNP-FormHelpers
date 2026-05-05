<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class UploadReceiptEvidenceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('receipt.uploadEvidence') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * Note: Receipt evidence preserves a 5MB file limit, smaller than Invoice's
     * 10MB limit (UploadEvidenceRequest). Documented as audit finding.
     */
    public function rules(): array
    {
        return [
            'files' => 'required|array|min:1',
            'files.*' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120', // 5MB
            'description' => 'nullable|string|max:500',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'files.required' => 'กรุณาเลือกไฟล์',
            'files.array' => 'รูปแบบไฟล์ไม่ถูกต้อง',
            'files.min' => 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์',
            'files.*.file' => 'ไฟล์ไม่ถูกต้อง',
            'files.*.mimes' => 'ไฟล์ต้องเป็น jpg, jpeg, png หรือ pdf เท่านั้น',
            'files.*.max' => 'ขนาดไฟล์ต้องไม่เกิน 5MB',
            'description.string' => 'คำอธิบายต้องเป็นข้อความ',
            'description.max' => 'คำอธิบายยาวเกิน 500 ตัวอักษร',
        ];
    }
}
