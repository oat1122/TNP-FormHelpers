<?php

namespace App\Http\Resources\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, // Uses accessor from Customer model
            'customer_code' => $this->customer_code, // Uses accessor
            'name' => $this->name, // Uses accessor
            'company_name' => $this->company_name, // Uses accessor
            'tax_id' => $this->tax_id, // Uses accessor
            'address' => $this->address, // Uses accessor
            'phone' => $this->phone, // Uses accessor
            'email' => $this->email, // Uses accessor
            'contact_person' => $this->contact_person, // Uses accessor
            'is_active' => $this->is_active, // Uses accessor
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'), // Uses accessor
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'), // Uses accessor
            
            // Raw database fields for reference
            'raw_data' => [
                'cus_id' => $this->cus_id,
                'cus_no' => $this->cus_no,
                'cus_firstname' => $this->cus_firstname,
                'cus_lastname' => $this->cus_lastname,
                'cus_company' => $this->cus_company,
                'cus_email' => $this->cus_email,
                'cus_tel_1' => $this->cus_tel_1,
                'cus_address' => $this->cus_address,
                'cus_tax_id' => $this->cus_tax_id,
                'cus_is_use' => $this->cus_is_use,
            ],
            
            // Summary data when loaded
            'quotations_count' => $this->whenCounted('quotations'),
            'invoices_count' => $this->whenCounted('invoices'),
            'total_quotation_amount' => $this->when(
                $this->relationLoaded('quotations'),
                fn () => $this->quotations->sum('total_amount')
            ),
            'total_outstanding_amount' => $this->when(
                $this->relationLoaded('invoices'),
                fn () => $this->invoices->sum('remaining_amount')
            ),
        ];
    }
}
