<?php

namespace App\Http\Requests\MaxSupply;

use App\Enums\MaxSupply\Status;
use App\Models\MaxSupply\MaxSupply;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StatusUpdateRequest extends FormRequest
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
        $maxSupply = $this->route('maxSupply');

        return [
            'status' => ['required', new Enum(Status::class)],
            'completed_quantity' => [
                'nullable',
                'integer',
                'min:0',
                function ($attribute, $value, $fail) use ($maxSupply) {
                    if ($maxSupply instanceof MaxSupply && $value > $maxSupply->total_quantity) {
                        $fail('จำนวนที่ผลิตเสร็จแล้วต้องไม่เกินจำนวนทั้งหมด');
                    }
                },
            ],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'status' => 'สถานะ',
            'completed_quantity' => 'จำนวนที่ผลิตเสร็จแล้ว',
        ];
    }
}
