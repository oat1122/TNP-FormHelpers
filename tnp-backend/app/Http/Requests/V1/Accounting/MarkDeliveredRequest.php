<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class MarkDeliveredRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('delivery-note.markDelivered') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'recipient_name' => 'nullable|string|max:255',
            'delivery_notes' => 'nullable|string|max:1000',
        ];
    }
}
