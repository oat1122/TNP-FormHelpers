<?php

namespace App\Http\Resources\V1\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Minimal MasterCustomer info for embedding in Accounting document responses.
 * FE expects `cus_*` snake_case field names (Worksheet/CRM legacy convention).
 *
 * Excludes: allocation tracking, manage_by linkage, created/updated audit
 * fields, channel/source attribution. These belong to the CRM admin views,
 * not accounting documents.
 */
class CustomerMiniResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'cus_id' => $this->cus_id,
            'cus_no' => $this->cus_no ?? '',
            'cus_company' => $this->cus_company ?? '',
            'cus_firstname' => $this->cus_firstname ?? '',
            'cus_lastname' => $this->cus_lastname ?? '',
            'cus_name' => $this->cus_name ?? '',
            'cus_tax_id' => $this->cus_tax_id ?? '',
            'cus_tel_1' => $this->cus_tel_1 ?? '',
            'cus_tel_2' => $this->cus_tel_2 ?? '',
            'cus_email' => $this->cus_email ?? '',
            'cus_address' => $this->cus_address ?? '',
            'cus_zip_code' => $this->cus_zip_code ?? '',
            'cus_depart' => $this->cus_depart ?? '',

            // Business attribution + location IDs — FE consumes these in
            // quotationUtils::normalizeCustomer + CustomerEditCard form
            'cus_channel' => $this->cus_channel,
            'cus_bt_id' => $this->cus_bt_id,
            'cus_pro_id' => $this->cus_pro_id,
            'cus_dis_id' => $this->cus_dis_id,
            'cus_sub_id' => $this->cus_sub_id,

            // Manager linkage — FE managerLogic::getManagerDisplayName reads this.
            // Raw int (user_id) is sent when the relation is not eager-loaded;
            // FE handles both cases (object or int).
            'cus_manage_by' => $this->cus_manage_by,
        ];
    }
}
