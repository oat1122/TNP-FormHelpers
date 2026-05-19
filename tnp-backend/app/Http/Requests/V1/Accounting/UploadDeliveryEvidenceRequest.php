<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class UploadDeliveryEvidenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('delivery-note.uploadEvidence') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'files' => 'required|array|min:1',
            // 5MB max per file; MIME validated server-side (Laravel sniffs real content type)
            'files.*' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'description' => 'nullable|string|max:500',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'files.required' => 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์',
            'files.*.mimes' => 'รองรับเฉพาะไฟล์ jpg, jpeg, png, pdf',
            'files.*.max' => 'ขนาดไฟล์ต้องไม่เกิน 5MB',
        ];
    }
}
