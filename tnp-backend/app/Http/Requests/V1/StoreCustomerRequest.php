<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation
     * Note: Business logic for telesales (auto-set source/allocation) is handled in Controller
     */
    protected function prepareForValidation(): void
    {
        // Auto-set cus_channel=1 (sales) when source is telesales for backward compatibility
        if ($this->input('cus_source') === 'telesales' && !$this->has('cus_channel')) {
            $this->merge([
                'cus_channel' => 1, // Sales channel
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            // Required fields
            'cus_channel' => ['required', 'integer', 'in:1,2,3'], // 1=sales, 2=online, 3=office
            'cus_company' => ['required', 'string', 'max:255'],
            'cus_firstname' => ['required', 'string', 'max:255'],
            'cus_lastname' => ['required', 'string', 'max:255'],
            'cus_name' => ['required', 'string', 'max:255'],
            'cus_tel_1' => ['required', 'string', 'max:20'],
            
            // Optional fields
            'cus_tel_2' => ['nullable', 'string', 'max:20'],
            'cus_email' => ['nullable', 'email', 'max:100'],
            'cus_tax_id' => ['nullable', 'string', 'max:13'],
            'cus_depart' => ['nullable', 'string', 'max:255'],
            'cus_address' => ['nullable', 'string'],
            'cus_address_detail' => ['nullable', 'string', 'max:500'], // Street/Soi details
            'cus_zip_code' => ['nullable', 'string', 'max:10'],
            'cus_pro_id' => ['nullable'],
            'cus_dis_id' => ['nullable'],
            'cus_sub_id' => ['nullable'],
            'cus_bt_id' => ['nullable', 'string', 'max:36'], // Business Type ID
            
            // Customer Detail fields (notes/remarks)
            'cd_note' => ['nullable', 'string', 'max:2000'],
            'cd_remark' => ['nullable', 'string', 'max:1000'],
            
            // New telesales fields
            'cus_source' => ['nullable', Rule::in(['sales', 'telesales', 'online', 'office'])],
            'cus_allocation_status' => ['nullable', Rule::in(['pool', 'allocated'])],
            'cus_manage_by' => ['nullable'], // Can be object or integer
            'cus_allocated_by' => ['nullable', 'integer'], // User ID who allocated (for telesales)
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
            'cus_channel.required' => 'กรุณาเลือกช่องทางการติดต่อ',
            'cus_channel.in' => 'ช่องทางการติดต่อไม่ถูกต้อง',
            'cus_company.required' => 'กรุณากรอกชื่อบริษัท',
            'cus_firstname.required' => 'กรุณากรอกชื่อ',
            'cus_lastname.required' => 'กรุณากรอกนามสกุล',
            'cus_name.required' => 'กรุณากรอกชื่อเต็ม',
            'cus_tel_1.required' => 'กรุณากรอกเบอร์โทรศัพท์',
            'cus_tel_1.max' => 'เบอร์โทรศัพท์ต้องไม่เกิน 20 หลัก',
            'cus_tel_2.max' => 'เบอร์โทรศัพท์ต้องไม่เกิน 20 หลัก',
            'cus_email.email' => 'รูปแบบอีเมลไม่ถูกต้อง',
            'cus_tax_id.size' => 'เลขประจำตัวผู้เสียภาษีต้องเป็น 13 หลัก',
            'cus_zip_code.size' => 'รหัสไปรษณีย์ต้องเป็น 5 หลัก',
            'cus_source.in' => 'แหล่งที่มาลูกค้าไม่ถูกต้อง',
            'cus_allocation_status.in' => 'สถานะการจัดสรรไม่ถูกต้อง',
        ];
    }
}
