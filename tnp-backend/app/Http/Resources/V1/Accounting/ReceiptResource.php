<?php

namespace App\Http\Resources\V1\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Receipt response shape — preserves all top-level scalar fields the FE
 * consumes, narrows embedded user/customer relations via mini resources.
 *
 * Legacy accessor aliases (receipt_type / payment_date / payment_amount /
 * vat_rate / vat_amount) were removed from $appends in m7.1 for over-fetch
 * reasons; callers that need them can call `->append([...])` per request.
 *
 * @see app/Models/Accounting/Receipt.php
 */
class ReceiptResource extends JsonResource
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
            'invoice_id' => $this->invoice_id,
            'customer_id' => $this->customer_id,

            // Customer header (denormalized)
            'customer_company' => $this->customer_company,
            'customer_tax_id' => $this->customer_tax_id,
            'customer_address' => $this->customer_address,
            'customer_zip_code' => $this->customer_zip_code,
            'customer_tel_1' => $this->customer_tel_1,
            'customer_email' => $this->customer_email,
            'customer_firstname' => $this->customer_firstname,
            'customer_lastname' => $this->customer_lastname,

            // Work + status + type
            'work_name' => $this->work_name,
            'quantity' => $this->quantity,
            'type' => $this->type,
            'status' => $this->status,

            // Financial
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->tax_amount,
            'total_amount' => $this->total_amount,

            // Payment
            'payment_method' => $this->payment_method,
            'payment_reference' => $this->payment_reference,
            'tax_invoice_number' => $this->tax_invoice_number,

            // Notes + audit
            'notes' => $this->notes,
            'issued_by' => $this->issued_by,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Relations — narrow user/customer via mini resources
            'customer' => new CustomerMiniResource($this->whenLoaded('customer')),
            'issuer' => new UserMiniResource($this->whenLoaded('issuer')),
            'approver' => new UserMiniResource($this->whenLoaded('approver')),

            // Linked docs — pass through
            'invoice' => $this->whenLoaded('invoice'),
            'deliveryNotes' => $this->whenLoaded('deliveryNotes'),
            'documentHistory' => $this->whenLoaded('documentHistory'),
            'attachments' => $this->whenLoaded('attachments'),
        ];
    }
}
