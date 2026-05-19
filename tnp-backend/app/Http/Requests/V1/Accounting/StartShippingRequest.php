<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class StartShippingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('delivery-note.startShipping') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'tracking_number' => 'nullable|string|max:100',
            'courier_company' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
