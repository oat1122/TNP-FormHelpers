<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Change Grade Request
 * 
 * Validation สำหรับการเปลี่ยน Grade ลูกค้า
 * Grade ลำดับ: D → C → B → A (upgrade) หรือ A → B → C → D (downgrade)
 */
class ChangeGradeRequest extends FormRequest
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
            'direction' => ['required', 'string', 'in:up,down'],
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
            'direction.required' => 'กรุณาระบุทิศทางการเปลี่ยน Grade',
            'direction.in' => 'ทิศทางต้องเป็น "up" (เลื่อนขั้น) หรือ "down" (ลดขั้น) เท่านั้น',
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
            'direction' => 'ทิศทางการเปลี่ยน Grade',
        ];
    }
}
