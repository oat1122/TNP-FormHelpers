<?php

namespace App\Http\Requests\MaxSupply;

use App\Enums\MaxSupply\Priority;
use App\Enums\MaxSupply\ProductionType;
use App\Enums\MaxSupply\ShirtType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

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
            'worksheet_id' => ['required', 'string', 'exists:new_worksheets,worksheet_id'],
            'screen_id' => ['nullable', 'string', 'exists:new_worksheet_screens,screen_id'],
            'title' => ['required', 'string', 'max:255'],
            'customer_name' => ['required', 'string', 'max:255'],
            'production_type' => ['required', new Enum(ProductionType::class)],
            'start_date' => ['required', 'date', 'before_or_equal:expected_completion_date'],
            'expected_completion_date' => ['required', 'date', 'before_or_equal:due_date'],
            'due_date' => ['required', 'date', 'after_or_equal:expected_completion_date'],
            'priority' => ['required', new Enum(Priority::class)],
            'shirt_type' => ['required', new Enum(ShirtType::class)],
            'total_quantity' => ['required', 'integer', 'min:1'],
            'sizes' => ['required', 'array'],
            'sizes.*' => ['integer', 'min:1'],
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
            'worksheet_id' => 'ไอดีใบงาน',
            'screen_id' => 'ไอดีสกรีน',
            'title' => 'ชื่องาน',
            'customer_name' => 'ชื่อลูกค้า',
            'production_type' => 'ประเภทการผลิต',
            'start_date' => 'วันที่เริ่มงาน',
            'expected_completion_date' => 'วันที่คาดว่าจะเสร็จ',
            'due_date' => 'วันที่กำหนดส่ง',
            'priority' => 'ความสำคัญ',
            'shirt_type' => 'ประเภทเสื้อ',
            'total_quantity' => 'จำนวนทั้งหมด',
            'sizes' => 'ขนาด',
            'notes' => 'หมายเหตุ',
            'special_instructions' => 'คำแนะนำพิเศษ',
        ];
    }
}
