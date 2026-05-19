<?php

namespace App\Http\Resources\V1\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Quotation response shape — preserves all top-level scalar fields the FE
 * consumes, narrows embedded user/customer relations via mini resources.
 *
 * @see app/Models/Accounting/Quotation.php
 */
class QuotationResource extends JsonResource
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
            'customer_id' => $this->customer_id,
            'primary_pricing_request_id' => $this->primary_pricing_request_id,
            'primary_pricing_request_ids' => $this->primary_pricing_request_ids,

            // Customer header (denormalized) — FE has fallback chains, keep all
            'customer_company' => $this->customer_company,
            'customer_tax_id' => $this->customer_tax_id,
            'customer_address' => $this->customer_address,
            'customer_zip_code' => $this->customer_zip_code,
            'customer_tel_1' => $this->customer_tel_1,
            'customer_email' => $this->customer_email,
            'customer_firstname' => $this->customer_firstname,
            'customer_lastname' => $this->customer_lastname,
            'customer_snapshot' => $this->customer_snapshot,

            // Work + status
            'work_name' => $this->work_name,
            'status' => $this->status,

            // Financial
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->tax_amount,
            'special_discount_percentage' => $this->special_discount_percentage,
            'special_discount_amount' => $this->special_discount_amount,
            'has_withholding_tax' => $this->has_withholding_tax,
            'withholding_tax_percentage' => $this->withholding_tax_percentage,
            'withholding_tax_amount' => $this->withholding_tax_amount,
            'final_total_amount' => $this->final_total_amount,
            'total_amount' => $this->total_amount,
            'has_vat' => $this->has_vat,
            'vat_percentage' => $this->vat_percentage,
            'pricing_mode' => $this->pricing_mode,

            // Deposit
            'deposit_percentage' => $this->deposit_percentage,
            'deposit_amount' => $this->deposit_amount,
            'deposit_mode' => $this->deposit_mode,

            // Payment terms
            'payment_terms' => $this->payment_terms,
            'due_date' => $this->due_date,
            'notes' => $this->notes,
            'document_header_type' => $this->document_header_type,

            // Media
            'signature_images' => $this->signature_images,
            'sample_images' => $this->sample_images,

            // Audit
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Computed (from $appends)
            'calculated_withholding_tax' => $this->calculated_withholding_tax,
            'net_after_discount' => $this->net_after_discount,
            'final_net_amount' => $this->final_net_amount,

            // Relations — narrow user/customer via mini resources
            'customer' => new CustomerMiniResource($this->whenLoaded('customer')),
            'creator' => new UserMiniResource($this->whenLoaded('creator')),
            'approver' => new UserMiniResource($this->whenLoaded('approver')),

            // Linked docs + items — pass through (FE reads many fields verbatim)
            'company' => $this->whenLoaded('company'),
            'pricingRequest' => $this->whenLoaded('pricingRequest'),
            'primaryPricingRequest' => $this->whenLoaded('primaryPricingRequest'),
            'pricingRequests' => $this->whenLoaded('pricingRequests'),
            'quotationPricingRequests' => $this->whenLoaded('quotationPricingRequests'),
            'invoices' => $this->whenLoaded('invoices'),
            'orderItemsTracking' => $this->whenLoaded('orderItemsTracking'),
            'items' => $this->whenLoaded('items'),
            'documentHistory' => $this->whenLoaded('documentHistory'),
            'attachments' => $this->whenLoaded('attachments'),
        ];
    }
}
