<?php

namespace App\Http\Resources\V1\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Invoice response shape — preserves all top-level scalar fields the FE
 * consumes (defensive fallback chains require full surface), but narrows
 * embedded user/customer relations via mini resources to stop leaking
 * password / phone / audit metadata.
 *
 * @see app/Models/Accounting/Invoice.php
 */
class InvoiceResource extends JsonResource
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
            'number_before' => $this->number_before,
            'number_after' => $this->number_after,
            'company_id' => $this->company_id,
            'quotation_id' => $this->quotation_id,
            'reference_invoice_id' => $this->reference_invoice_id,
            'reference_invoice_number' => $this->reference_invoice_number,
            'primary_pricing_request_id' => $this->primary_pricing_request_id,
            'primary_pricing_request_ids' => $this->primary_pricing_request_ids,
            'customer_id' => $this->customer_id,
            'customer_data_source' => $this->customer_data_source,

            // Customer header (denormalized)
            'customer_company' => $this->customer_company,
            'customer_tax_id' => $this->customer_tax_id,
            'customer_address' => $this->customer_address,
            'customer_zip_code' => $this->customer_zip_code,
            'customer_tel_1' => $this->customer_tel_1,
            'customer_email' => $this->customer_email,
            'customer_firstname' => $this->customer_firstname,
            'customer_lastname' => $this->customer_lastname,
            'customer_snapshot' => $this->customer_snapshot,

            // Status state machine (atomic + per-side)
            'status' => $this->status,
            'status_before' => $this->status_before,
            'status_after' => $this->status_after,
            'type' => $this->type,

            // Financial — totals + tax + discount
            'subtotal' => $this->subtotal,
            'net_subtotal' => $this->net_subtotal,
            'subtotal_before_vat' => $this->subtotal_before_vat,
            'tax_amount' => $this->tax_amount,
            'total_amount' => $this->total_amount,
            'special_discount_percentage' => $this->special_discount_percentage,
            'special_discount_amount' => $this->special_discount_amount,
            'has_vat' => $this->has_vat,
            'vat_percentage' => $this->vat_percentage,
            'pricing_mode' => $this->pricing_mode,
            'vat_amount' => $this->vat_amount,
            'has_withholding_tax' => $this->has_withholding_tax,
            'withholding_tax_percentage' => $this->withholding_tax_percentage,
            'withholding_tax_amount' => $this->withholding_tax_amount,
            'final_total_amount' => $this->final_total_amount,

            // Deposit
            'deposit_percentage' => $this->deposit_percentage,
            'deposit_amount' => $this->deposit_amount,
            'deposit_amount_before_vat' => $this->deposit_amount_before_vat,
            'deposit_display_order' => $this->deposit_display_order,
            'deposit_mode' => $this->deposit_mode,

            // Payment tracking
            'paid_amount' => $this->paid_amount,
            'paid_amount_before' => $this->paid_amount_before,
            'paid_amount_after' => $this->paid_amount_after,
            'due_date' => $this->due_date,
            'due_date_before' => $this->due_date_before,
            'due_date_after' => $this->due_date_after,
            'payment_method' => $this->payment_method,
            'payment_terms' => $this->payment_terms,

            // Work + notes
            'work_name' => $this->work_name,
            'fabric_type' => $this->fabric_type,
            'pattern' => $this->pattern,
            'color' => $this->color,
            'sizes' => $this->sizes,
            'quantity' => $this->quantity,
            'notes' => $this->notes,
            'notes_before' => $this->notes_before,
            'notes_after' => $this->notes_after,

            // Media
            'signature_images' => $this->signature_images,
            'sample_images' => $this->sample_images,
            'evidence_files' => $this->evidence_files,
            'document_header_type' => $this->document_header_type,

            // Audit trail
            'created_by' => $this->created_by,
            'inv_manage_by' => $this->inv_manage_by,
            'updated_by' => $this->updated_by,
            'submitted_by' => $this->submitted_by,
            'submitted_at' => $this->submitted_at,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at,
            'rejected_by' => $this->rejected_by,
            'rejected_at' => $this->rejected_at,
            'sent_by' => $this->sent_by,
            'sent_at' => $this->sent_at,
            'paid_at' => $this->paid_at,
            'last_synced_at' => $this->last_synced_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Relations — narrow user fields via UserMiniResource
            'customer' => new CustomerMiniResource($this->whenLoaded('customer')),
            'creator' => new UserMiniResource($this->whenLoaded('creator')),
            'updater' => new UserMiniResource($this->whenLoaded('updater')),
            'manager' => new UserMiniResource($this->whenLoaded('manager')),
            'submitter' => new UserMiniResource($this->whenLoaded('submitter')),
            'approver' => new UserMiniResource($this->whenLoaded('approver')),
            'rejecter' => new UserMiniResource($this->whenLoaded('rejecter')),
            'sender' => new UserMiniResource($this->whenLoaded('sender')),

            // Linked docs + items — pass through (FE reads many fields; preserve verbatim)
            'quotation' => $this->whenLoaded('quotation'),
            'items' => $this->whenLoaded('items'),
            'deliveryNotes' => $this->whenLoaded('deliveryNotes'),
            'primaryPricingRequest' => $this->whenLoaded('primaryPricingRequest'),
            'company' => $this->whenLoaded('company'),
            'referenceInvoice' => $this->whenLoaded('referenceInvoice'),
            'afterDepositInvoices' => $this->whenLoaded('afterDepositInvoices'),
            'receipts' => $this->whenLoaded('receipts'),
            'documentHistory' => $this->whenLoaded('documentHistory'),
            'attachments' => $this->whenLoaded('attachments'),
        ];
    }
}
