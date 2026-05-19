<?php

namespace App\Http\Resources\V1\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * DeliveryNote response shape — mirrors the legacy `$model->toArray()` output
 * that FE consumed pre-Resource, but with embedded user/customer fields
 * narrowed via UserMiniResource / CustomerMiniResource to stop leaking
 * password / audit fields / phone / etc. through the `creator`, `manager`,
 * `deliveryPerson`, and `customer` relations.
 *
 * FE relies on defensive fallback chains (e.g. `customer_company` →
 * `customer_snapshot.customer_company` → `customer.cus_company`) so all
 * top-level scalar fields are kept verbatim.
 *
 * @see app/Models/Accounting/DeliveryNote.php
 */
class DeliveryNoteResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // Identity + linkage
            'id' => $this->id,
            'number' => $this->number,
            'company_id' => $this->company_id,
            'sender_company_id' => $this->sender_company_id,
            'receipt_id' => $this->receipt_id,
            'invoice_id' => $this->invoice_id,
            'invoice_item_id' => $this->invoice_item_id,
            'invoice_number' => $this->invoice_number,
            'customer_id' => $this->customer_id,
            'customer_data_source' => $this->customer_data_source,

            // Customer header fields (denormalized on the DN itself)
            'customer_company' => $this->customer_company,
            'customer_address' => $this->customer_address,
            'customer_zip_code' => $this->customer_zip_code,
            'customer_tel_1' => $this->customer_tel_1,
            'customer_tax_id' => $this->customer_tax_id,
            'customer_firstname' => $this->customer_firstname,
            'customer_lastname' => $this->customer_lastname,
            'customer_snapshot' => $this->customer_snapshot,

            // Work + status
            'work_name' => $this->work_name,
            'quantity' => $this->quantity,
            'status' => $this->status,

            // Shipping
            'delivery_method' => $this->delivery_method,
            'courier_company' => $this->courier_company,
            'tracking_number' => $this->tracking_number,
            'delivery_address' => $this->delivery_address,
            'recipient_name' => $this->recipient_name,
            'recipient_phone' => $this->recipient_phone,
            'delivery_date' => $this->delivery_date,
            'delivered_at' => $this->delivered_at,
            'delivery_notes' => $this->delivery_notes,
            'notes' => $this->notes,

            // Audit
            'manage_by' => $this->manage_by,
            'created_by' => $this->created_by,
            'delivered_by' => $this->delivered_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Computed (from $appends)
            'customer_contact_name' => $this->customer_contact_name,
            'manager_full_name' => $this->manager_full_name,
            'customer_full_name' => $this->customer_full_name,

            // Relations — narrow user fields, preserve customer/invoice/items
            'customer' => new CustomerMiniResource($this->whenLoaded('customer')),
            'creator' => new UserMiniResource($this->whenLoaded('creator')),
            'deliveryPerson' => new UserMiniResource($this->whenLoaded('deliveryPerson')),
            'manager' => new UserMiniResource($this->whenLoaded('manager')),

            // Items — pass through (FE reads many fields; preserve shape verbatim)
            'items' => $this->whenLoaded('items'),

            // Linked accounting documents — pass through (other Resources will narrow these later)
            'receipt' => $this->whenLoaded('receipt'),
            'invoice' => $this->whenLoaded('invoice'),
            'invoiceItem' => $this->whenLoaded('invoiceItem'),

            // History + attachments — pass through
            'documentHistory' => $this->whenLoaded('documentHistory'),
            'attachments' => $this->whenLoaded('attachments'),
        ];
    }
}
