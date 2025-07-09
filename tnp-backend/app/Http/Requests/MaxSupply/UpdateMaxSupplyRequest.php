<?php

namespace App\Http\Requests\MaxSupply;

use App\Enums\MaxSupply\Priority;
use App\Enums\MaxSupply\ProductionType;
use App\Enums\MaxSupply\ShirtType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

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
            'title' => ['sometimes', 'string', 'max:255'],
            'customer_name' => ['sometimes', 'string', 'max:255'],
            'production_type' => ['sometimes', new Enum(ProductionType::class)],
            'start_date' => ['sometimes', 'date', 'before_or_equal:expected_completion_date'],
            'expected_completion_date' => ['sometimes', 'date', 'before_or_equal:due_date'],
            'due_date' => ['sometimes', 'date', 'after_or_equal:expected_completion_date'],
            'priority' => ['sometimes', new Enum(Priority::class)],
            'shirt_type' => ['sometimes', new Enum(ShirtType::class)],
            'total_quantity' => ['sometimes', 'integer', 'min:1'],
            'completed_quantity' => ['sometimes', 'integer', 'min:0'],
            'sizes' => ['sometimes', 'array'],
            'sizes.*' => ['integer', 'min:1'],
            'screen_points' => ['sometimes', 'integer', 'min:0'],
            'dtf_points' => ['sometimes', 'integer', 'min:0'],
            'sublimation_points' => ['sometimes', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
            'special_instructions' => ['nullable', 'string'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'title' => 'ชื่องาน',
            'customer_name' => 'ชื่อลูกค้า',
            'production_type' => 'ประเภทการผลิต',
            'start_date' => 'วันที่เริ่มงาน',
            'expected_completion_date' => 'วันที่คาดว่าจะเสร็จ',
            'due_date' => 'วันที่กำหนดส่ง',
            'priority' => 'ความสำคัญ',
            'shirt_type' => 'ประเภทเสื้อ',
            'total_quantity' => 'จำนวนทั้งหมด',
            'completed_quantity' => 'จำนวนที่ผลิตเสร็จแล้ว',
            'sizes' => 'ขนาด',
            'screen_points' => 'จุดพิมพ์ประเภท Screen',
            'dtf_points' => 'จุดพิมพ์ประเภท DTF',
            'sublimation_points' => 'จุดพิมพ์ประเภท Sublimation',
            'notes' => 'หมายเหตุ',
            'special_instructions' => 'คำแนะนำพิเศษ',
        ];
    }
}
