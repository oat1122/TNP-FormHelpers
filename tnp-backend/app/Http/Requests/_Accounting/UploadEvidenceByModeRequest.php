<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class UploadEvidenceByModeRequest extends FormRequest
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
            'files' => 'required|array|min:1|max:10',
            'files.*' => 'file|mimes:jpeg,jpg,png,pdf|max:10240', // 10MB per file
            'description' => 'nullable|string|max:500',
            'mode' => 'required|in:before,after'
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'files.required' => 'กรุณาเลือกไฟล์',
            'files.min' => 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์',
            'files.max' => 'สามารถอัปโหลดได้สูงสุด 10 ไฟล์ต่อครั้ง',
            'files.*.mimes' => 'ไฟล์ต้องเป็น jpeg, jpg, png หรือ pdf เท่านั้น',
            'files.*.max' => 'ขนาดไฟล์ต้องไม่เกิน 10MB',
            'mode.required' => 'กรุณาระบุโหมด',
            'mode.in' => 'โหมดต้องเป็น before หรือ after เท่านั้น',
        ];
    }
}
