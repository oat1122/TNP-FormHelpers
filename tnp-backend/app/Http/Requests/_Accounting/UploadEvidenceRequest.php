<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class UploadEvidenceRequest extends FormRequest
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
            'files' => 'required|array|min:1',
            'files.*' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240', // 10MB
            'description' => 'nullable|string|max:500'
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
            'files.*.file' => 'ไฟล์ไม่ถูกต้อง',
            'files.*.mimes' => 'ไฟล์ต้องเป็น jpg, jpeg, png หรือ pdf เท่านั้น',
            'files.*.max' => 'ขนาดไฟล์ต้องไม่เกิน 10MB',
        ];
    }
}
