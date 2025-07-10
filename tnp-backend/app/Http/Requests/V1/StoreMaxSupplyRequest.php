<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaxSupplyRequest extends FormRequest
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
            'worksheet_id' => 'required|exists:new_worksheets,worksheet_id',
            'title' => 'nullable|string|max:255',
            'production_type' => 'required|in:screen,dtf,sublimation',
            'start_date' => 'nullable|date|after_or_equal:today',
            'expected_completion_date' => 'required|date|after_or_equal:start_date',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'sizes' => 'nullable|array',
            'sizes.*' => 'integer|min:0',
            'notes' => 'nullable|string',
            'special_instructions' => 'nullable|string',
        ];
    }

    /**
     * Get custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'worksheet_id.required' => 'กรุณาเลือก Worksheet',
            'worksheet_id.exists' => 'Worksheet ที่เลือกไม่ถูกต้อง',
            'production_type.required' => 'กรุณาเลือกประเภทการผลิต',
            'production_type.in' => 'ประเภทการผลิตไม่ถูกต้อง',
            'start_date.after_or_equal' => 'วันที่เริ่มต้องไม่ย้อนหลัง',
            'expected_completion_date.required' => 'กรุณาระบุวันที่คาดว่าจะเสร็จ',
            'expected_completion_date.after_or_equal' => 'วันที่คาดว่าจะเสร็จต้องไม่ก่อนวันที่เริ่ม',
        ];
    }
}
