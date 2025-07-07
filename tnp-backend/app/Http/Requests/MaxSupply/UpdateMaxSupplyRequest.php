<?php

namespace App\Http\Requests\MaxSupply;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMaxSupplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'worksheet_id' => 'sometimes|integer',
            'title' => 'sometimes|string',
            'status' => 'sometimes|string',
            'due_date' => 'nullable|date',
        ];
    }
}
