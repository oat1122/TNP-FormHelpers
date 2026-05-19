<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class MarkDeliveryFailedRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('delivery-note.markFailed') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'reason' => 'required|string|max:1000',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'reason.required' => 'กรุณาระบุเหตุผลที่จัดส่งไม่สำเร็จ',
        ];
    }
}
