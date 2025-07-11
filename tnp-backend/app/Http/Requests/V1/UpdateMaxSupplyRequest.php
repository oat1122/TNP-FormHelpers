<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMaxSupplyRequest extends FormRequest
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
            'title' => 'nullable|string|max:255',
            'production_type' => 'nullable|in:screen,dtf,sublimation,embroidery',
            'start_date' => 'nullable|date',
            'expected_completion_date' => 'nullable|date|after_or_equal:start_date',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'shirt_type' => 'nullable|in:polo,t-shirt,hoodie,tank-top',
            'total_quantity' => 'nullable|integer|min:1',
            'completed_quantity' => 'nullable|integer|min:0',
            'sizes' => 'nullable|array',
            'sizes.*' => 'integer|min:0',
            'screen_points' => 'nullable|integer|min:0',
            'dtf_points' => 'nullable|integer|min:0',
            'sublimation_points' => 'nullable|integer|min:0',
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
            'production_type.in' => 'ประเภทการผลิตไม่ถูกต้อง',
            'expected_completion_date.after_or_equal' => 'วันที่คาดว่าจะเสร็จต้องไม่ก่อนวันที่เริ่ม',
            'total_quantity.min' => 'จำนวนรวมต้องมากกว่า 0',
            'completed_quantity.min' => 'จำนวนที่เสร็จต้องไม่ติดลบ',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $data = $this->validated();

            // Check completed quantity doesn't exceed total quantity
            if (isset($data['completed_quantity']) && isset($data['total_quantity'])) {
                if ($data['completed_quantity'] > $data['total_quantity']) {
                    $validator->errors()->add('completed_quantity', 'จำนวนที่เสร็จต้องไม่เกินจำนวนรวม');
                }
            }
        });
    }
}
