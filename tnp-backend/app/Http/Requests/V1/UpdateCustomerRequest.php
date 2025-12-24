<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Update Customer Request
 * 
 * Validation สำหรับการอัปเดตข้อมูลลูกค้า
 */
class UpdateCustomerRequest extends FormRequest
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
            'cus_address' => ['nullable', 'string', 'max:1000'],
            'cus_address_detail' => ['nullable', 'string', 'max:500'],
            'cus_zip_code' => ['nullable', 'string', 'max:10'],
            'cus_pro_id' => ['nullable'],
            'cus_dis_id' => ['nullable'],
            'cus_sub_id' => ['nullable'],
            'cus_bt_id' => ['nullable', 'string', 'max:36'], // Business Type ID
            'cus_manage_by' => ['nullable'], // Can be object or integer
            
            // Customer Detail fields
            'cd_note' => ['nullable', 'string', 'max:2000'],
            'cd_status' => ['nullable', 'string', 'max:50'],
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
            'cus_channel.in' => 'ช่องทางการติดต่อไม่ถูกต้อง (ต้องเป็น 1, 2 หรือ 3)',
            'cus_company.required' => 'กรุณากรอกชื่อบริษัท',
            'cus_company.max' => 'ชื่อบริษัทต้องไม่เกิน 255 ตัวอักษร',
            'cus_firstname.required' => 'กรุณากรอกชื่อ',
            'cus_firstname.max' => 'ชื่อต้องไม่เกิน 255 ตัวอักษร',
            'cus_lastname.required' => 'กรุณากรอกนามสกุล',
            'cus_lastname.max' => 'นามสกุลต้องไม่เกิน 255 ตัวอักษร',
            'cus_name.required' => 'กรุณากรอกชื่อเต็ม',
            'cus_name.max' => 'ชื่อเต็มต้องไม่เกิน 255 ตัวอักษร',
            'cus_tel_1.required' => 'กรุณากรอกเบอร์โทรศัพท์',
            'cus_tel_1.max' => 'เบอร์โทรศัพท์ต้องไม่เกิน 20 ตัวอักษร',
            'cus_tel_2.max' => 'เบอร์โทรศัพท์ 2 ต้องไม่เกิน 20 ตัวอักษร',
            'cus_email.email' => 'รูปแบบอีเมลไม่ถูกต้อง',
            'cus_email.max' => 'อีเมลต้องไม่เกิน 100 ตัวอักษร',
            'cus_tax_id.max' => 'เลขประจำตัวผู้เสียภาษีต้องไม่เกิน 13 หลัก',
            'cus_address.max' => 'ที่อยู่ต้องไม่เกิน 1000 ตัวอักษร',
            'cus_address_detail.max' => 'รายละเอียดที่อยู่ต้องไม่เกิน 500 ตัวอักษร',
            'cd_note.max' => 'บันทึกต้องไม่เกิน 2000 ตัวอักษร',
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
            'cus_channel' => 'ช่องทางการติดต่อ',
            'cus_company' => 'ชื่อบริษัท',
            'cus_firstname' => 'ชื่อ',
            'cus_lastname' => 'นามสกุล',
            'cus_name' => 'ชื่อเต็ม',
            'cus_tel_1' => 'เบอร์โทรศัพท์',
            'cus_tel_2' => 'เบอร์โทรศัพท์ 2',
            'cus_email' => 'อีเมล',
            'cus_tax_id' => 'เลขประจำตัวผู้เสียภาษี',
            'cus_address' => 'ที่อยู่',
        ];
    }
}
