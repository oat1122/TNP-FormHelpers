<?php

namespace App\Http\Requests\V1\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class StoreDeliveryNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('delivery-note.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'company_id' => 'nullable|string|exists:companies,id',
            'invoice_id' => 'nullable|string|exists:invoices,id',
            'invoice_item_id' => 'nullable|string|exists:invoice_items,id',
            'invoice_number' => 'nullable|string|max:50',
            'customer_id' => 'nullable|string|exists:master_customers,cus_id',
            'customer_data_source' => 'nullable|in:master,delivery',
            'customer_company' => 'nullable|string|max:255',
            'customer_address' => 'nullable|string|max:500',
            'customer_zip_code' => 'nullable|string|max:10',
            'customer_tel_1' => 'nullable|string|max:50',
            'customer_tax_id' => 'nullable|string|max:50',
            'customer_firstname' => 'nullable|string|max:100',
            'customer_lastname' => 'nullable|string|max:100',
            'customer_snapshot' => 'nullable',
            'work_name' => 'nullable|string|max:255',
            'quantity' => 'nullable|string|max:50',
            'delivery_method' => 'nullable|in:self_delivery,courier,customer_pickup',
            'delivery_address' => 'nullable|string|max:500',
            'recipient_name' => 'nullable|string|max:255',
            'recipient_phone' => 'nullable|string|max:50',
            'delivery_date' => 'nullable|date',
            'courier_company' => 'nullable|string|max:100',
            'tracking_number' => 'nullable|string|max:100',
            'delivery_notes' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:1000',
            'sender_company_id' => 'nullable|string|exists:companies,id',
            'manage_by' => 'nullable|integer|exists:users,user_id',
            'items' => 'sometimes|array',
            'items.*.sequence_order' => 'nullable|integer|min:1',
            'items.*.item_name' => 'required_with:items|string|max:255',
            'items.*.item_description' => 'nullable|string',
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
            'company_id.exists' => 'บริษัทที่เลือกไม่ถูกต้อง',
            'invoice_id.exists' => 'ใบแจ้งหนี้ที่อ้างอิงไม่ถูกต้อง',
            'customer_id.exists' => 'ลูกค้าที่เลือกไม่ถูกต้อง',
            'delivery_method.in' => 'วิธีการจัดส่งไม่ถูกต้อง',
            'items.*.item_name.required_with' => 'กรุณาระบุชื่อรายการสินค้า',
        ];
    }
}
