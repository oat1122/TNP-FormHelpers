<?php

namespace App\Http\Requests\MaxSupply;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaxSupplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'worksheet_id' => 'required|integer',
            'title' => 'required|string',
            'due_date' => 'nullable|date',
        ];
    }
}
