<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeliveryNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('delivery-note.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'customer_company' => 'sometimes|string|max:255',
            'invoice_id' => 'sometimes|string|exists:invoices,id',
            'invoice_item_id' => 'sometimes|string|exists:invoice_items,id',
            'customer_address' => 'sometimes|string|max:500',
            'work_name' => 'sometimes|string|max:255',
            'delivery_method' => 'sometimes|in:self_delivery,courier,customer_pickup',
            'delivery_address' => 'sometimes|string|max:500',
            'recipient_name' => 'sometimes|string|max:255',
            'recipient_phone' => 'sometimes|string|max:50',
            // SECURITY: removed `after_or_equal:today` — admin can't fix historical DN dates if locked
            'delivery_date' => 'sometimes|date',
            'courier_company' => 'sometimes|string|max:100',
            'tracking_number' => 'sometimes|string|max:100',
            'delivery_notes' => 'sometimes|string|max:1000',
            'notes' => 'sometimes|string|max:1000',
            'customer_tel_1' => 'sometimes|string|max:50',
            'customer_firstname' => 'sometimes|string|max:255',
            'customer_lastname' => 'sometimes|string|max:255',
            'customer_tax_id' => 'sometimes|string|max:50',
            'customer_data_source' => 'sometimes|in:master,delivery',
            'customer_snapshot' => 'sometimes',
            'sender_company_id' => 'sometimes|string|exists:companies,id',
            'manage_by' => 'sometimes|integer|exists:users,user_id',
            'items' => 'sometimes|array',
            'items.*.sequence_order' => 'nullable|integer|min:1',
            'items.*.item_name' => 'nullable|string|max:255',
            'items.*.item_description' => 'nullable|string|max:500',
            'items.*.pattern' => 'nullable|string|max:255',
            'items.*.fabric_type' => 'nullable|string|max:255',
            'items.*.color' => 'nullable|string|max:255',
            'items.*.size' => 'nullable|string|max:255',
            'items.*.delivered_quantity' => 'nullable|integer|min:0',
            'items.*.unit' => 'nullable|string|max:50',
            'items.*.invoice_id' => 'nullable|string|exists:invoices,id',
            'items.*.invoice_item_id' => 'nullable|string|exists:invoice_items,id',
            'items.*.item_snapshot' => 'nullable',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'delivery_method.in' => 'วิธีการจัดส่งไม่ถูกต้อง',
            'invoice_id.exists' => 'ใบแจ้งหนี้ที่อ้างอิงไม่ถูกต้อง',
        ];
    }
}
