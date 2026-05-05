<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class UploadQuotationSampleImagesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('quotation.uploadSampleImages') ?? false;
    }

    /**
     * Normalize a single uploaded file into a one-element array so callers
     * can send either `files` or `files[]` notation interchangeably.
     */
    protected function prepareForValidation(): void
    {
        $files = $this->file('files');
        if ($files !== null && ! is_array($files)) {
            $this->files->set('files', [$files]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'files' => 'required|array|min:1',
            'files.*' => 'required|image|mimes:jpg,jpeg,png|max:5120', // 5MB
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
            'files.*.image' => 'ไฟล์ต้องเป็นรูปภาพ',
            'files.*.mimes' => 'ไฟล์ต้องเป็น jpg, jpeg หรือ png เท่านั้น',
            'files.*.max' => 'ขนาดไฟล์ต้องไม่เกิน 5MB',
        ];
    }
}
