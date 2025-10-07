<?php

namespace App\Http\Resources\V1\Pricing;

use App\Services\PricingService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PricingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $PricingService = new PricingService;

        $cus_fullname = ($this->pricingCustomer->cus_firstname ?? '') . ' ' . ($this->pricingCustomer->cus_lastname ?? '');
        $images_r = $this->pr_image ? url('storage/images/pricing_req/' . $this->pr_image) : '';

        // Get user role from request to determine note visibility
        $user_uuid = $request->input('user') ?? $request->header('user');
        $user_role = null;
        if ($user_uuid) {
            $user_role = \App\Models\User::where('user_uuid', $user_uuid)->value('role');
        }

        $result = [
            'pr_id' => $this->pr_id,
            'pr_cus_id' => $this->pr_cus_id,
            'pr_mpc_id' => $this->pr_mpc_id ?? '',
            'pr_status_id' => $this->pr_status_id,
            'pr_no' => $this->pr_no ?? '',
            'pr_work_name' => $this->pr_work_name ?? '',
            'pr_pattern' => $this->pr_pattern ?? '',
            'pr_fabric_type' => $this->pr_fabric_type ?? '',
            'pr_color' => $this->pr_color ?? '',
            'pr_sizes' => $this->pr_sizes ?? '',
            'pr_quantity' => $this->pr_quantity ?? '',
            'pr_due_date' => $this->pr_due_date ?? null,
            'pr_silk' => $this->pr_silk ?? '',
            'pr_dft' => $this->pr_dft ?? '',
            'pr_embroider' => $this->pr_embroider ?? '',
            'pr_sub' => $this->pr_sub ?? '',
            'pr_other_screen' => $this->pr_other_screen ?? '',
            'pr_image' => $images_r,
            'pr_created_date' => $this->pr_created_date ?? '',
            'pr_created_by' => $this->pr_created_by ?? '',
            'pr_updated_date' => $this->pr_updated_date ?? '',
            'pr_updated_by' => $this->pr_updated_by ?? '',
            'created_name' => $this->prCreatedBy->user_nickname ?? '',    // sales name
            'status' => $this->pricingStatus->status_name ?? '',    // status name
            
            // customer section
            'cus_company' => $this->pricingCustomer->cus_company ?? '',
            'cus_name' => $this->pricingCustomer->cus_name ?? '',
            'cus_tel_1' => $this->pricingCustomer->cus_tel_1 ?? '',
            'cus_email' => $this->pricingCustomer->cus_email ?? '',
            'cus_fullname' => $cus_fullname,

            // note pricing
            'note_sales' => $PricingService->resultWithNoteType($this->pricingNote, 1),
            'note_price' => $PricingService->resultWithNoteType($this->pricingNote, 2),
        ];

        // Only include note_manager for roles other than account and sale
        if (!in_array($user_role, ['account', 'sale'])) {
            $result['note_manager'] = $PricingService->resultWithNoteType($this->pricingNote, 3);
        }

        return $result;
    }
}
