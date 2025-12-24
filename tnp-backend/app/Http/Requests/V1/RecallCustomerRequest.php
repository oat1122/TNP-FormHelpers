<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Recall Customer Request
 * 
 * Validation สำหรับการ Recall (ติดตาม) ลูกค้า
 */
class RecallCustomerRequest extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            // Required: Customer Group ID for calculating recall datetime
            'cus_mcg_id' => ['required', 'string', 'max:36', 'exists:master_customer_groups,mcg_id'],
            
            // Optional: Note and status
            'cd_note' => ['nullable', 'string', 'max:2000'],
            'cd_status' => ['nullable', 'string', 'max:50'],
            
            // Optional: Additional detail fields that may be updated
            'cd_remark' => ['nullable', 'string', 'max:1000'],
            'cd_product_interest' => ['nullable', 'string', 'max:500'],
            'cd_budget' => ['nullable', 'numeric', 'min:0'],
            'cd_priority' => ['nullable', 'string', 'in:low,medium,high'],
        ];
    }

    /**
     * Get custom error messages
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'cus_mcg_id.required' => 'กรุณาเลือกกลุ่มลูกค้า',
            'cus_mcg_id.exists' => 'กลุ่มลูกค้าที่เลือกไม่มีอยู่ในระบบ',
            'cus_mcg_id.max' => 'รหัสกลุ่มลูกค้าไม่ถูกต้อง',
            'cd_note.max' => 'บันทึกต้องไม่เกิน 2000 ตัวอักษร',
            'cd_status.max' => 'สถานะต้องไม่เกิน 50 ตัวอักษร',
            'cd_remark.max' => 'หมายเหตุต้องไม่เกิน 1000 ตัวอักษร',
            'cd_product_interest.max' => 'สินค้าที่สนใจต้องไม่เกิน 500 ตัวอักษร',
            'cd_budget.numeric' => 'งบประมาณต้องเป็นตัวเลข',
            'cd_budget.min' => 'งบประมาณต้องไม่ต่ำกว่า 0',
            'cd_priority.in' => 'ความสำคัญต้องเป็น low, medium หรือ high',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array
     */
    public function attributes(): array
    {
        return [
            'cus_mcg_id' => 'กลุ่มลูกค้า',
            'cd_note' => 'บันทึก',
            'cd_status' => 'สถานะ',
            'cd_remark' => 'หมายเหตุ',
            'cd_product_interest' => 'สินค้าที่สนใจ',
            'cd_budget' => 'งบประมาณ',
            'cd_priority' => 'ความสำคัญ',
        ];
    }
}
