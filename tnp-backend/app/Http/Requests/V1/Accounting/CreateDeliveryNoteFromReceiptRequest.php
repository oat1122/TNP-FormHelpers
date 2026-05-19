<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class CreateDeliveryNoteFromReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('delivery-note.createFromReceipt') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'receipt_id' => 'required|string|exists:receipts,id',
            'delivery_method' => 'required|in:self_delivery,courier,customer_pickup',
            'courier_company' => 'required_if:delivery_method,courier|string|max:100',
            'delivery_address' => 'nullable|string|max:500',
            'recipient_name' => 'nullable|string|max:255',
            'recipient_phone' => 'nullable|string|max:50',
            // Allow past dates so DN can be back-dated for historical receipts
            'delivery_date' => 'nullable|date',
            'delivery_notes' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'receipt_id.required' => 'กรุณาระบุใบเสร็จ',
            'receipt_id.exists' => 'ไม่พบใบเสร็จที่ระบุ',
            'delivery_method.required' => 'กรุณาเลือกวิธีจัดส่ง',
            'delivery_method.in' => 'วิธีการจัดส่งไม่ถูกต้อง',
            'courier_company.required_if' => 'กรุณาระบุบริษัทขนส่งเมื่อเลือกวิธี courier',
        ];
    }
}
