<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class MarkDeliveryCompletedRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('delivery-note.markCompleted') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
