<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Services\GlobalService;

class CustomerResource extends JsonResource
{
    private GlobalService $globalService;

    public function __construct($resource)
    {
        parent::__construct($resource);
        $this->globalService = new GlobalService();
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        static $cus_no_r, $cus_channel_r, $cus_tel_1_r, $cus_tel_2_r;

        $cus_no_r = str_pad($this->cus_no, 6, '0', STR_PAD_LEFT); // เติมเลข 0 ด้านหน้า cus_no ให้ครบ 6 หลัก
        $cus_tel_1_r = $this->globalService->formatThaiPhoneNumber($this->cus_tel_1);
        $cus_tel_2_r = $this->globalService->formatThaiPhoneNumber($this->cus_tel_2);

        return [
            'cus_id' => $this->cus_id,
            'cus_mcg_id' => $this->cus_mcg_id,
            'cus_no' => $cus_no_r,
            'cus_channel' => $this->cus_channel ?? '',
            'cus_bt_id' => $this->cus_bt_id ?? '',
            'business_type' => $this->businessType ? $this->businessType->bt_name : '',
            'cus_firstname' => $this->cus_firstname ?? '',
            'cus_lastname' => $this->cus_lastname ?? '',
            'cus_name' => $this->cus_name ?? '',
            'cus_depart' => $this->cus_depart ?? '',
            'cus_company' => $this->cus_company ?? '',
            'cus_tel_1' => $cus_tel_1_r ?? '',
            'cus_tel_2' => $cus_tel_2_r ?? '',
            'cus_email' => $this->cus_email ?? '',
            'cus_tax_id' => $this->cus_tax_id ?? '',
            'cus_pro_id' => $this->cus_pro_id ?? '',
            'cus_dis_id' => $this->cus_dis_id ?? '',
            'cus_sub_id' => $this->cus_sub_id ?? '',
            'cus_zip_code' => $this->cus_zip_code ?? '',
            'cus_address' => $this->cus_address ?? '',
            'cus_full_address' => $this->full_address ?? $this->cus_address ?? '',
            'cus_address_components' => $this->address_components ?? [],
            'cus_province_name' => $this->customerProvice?->pro_name_th ?? '',
            'cus_district_name' => $this->customerDistrict?->dis_name_th ?? '',
            'cus_subdistrict_name' => $this->customerSubdistrict?->sub_name_th ?? '',
            'cus_manage_by' => $this->formatManagerData(),
            'cus_is_use' => $this->cus_is_use,
            'cd_id' => $this->customerDetail?->cd_id,
            'cd_last_datetime' => $this->customerDetail?->cd_last_datetime ?? '',
            'cd_note' => $this->customerDetail?->cd_note ?? '',
            'cd_remark' => $this->customerDetail?->cd_remark ?? '',
            'cus_created_date' => $this->cus_created_date,
            'sales_name' => $this->cus_manage_by ? $this->cusManageBy?->username : '',
            'province_sort_id' => $this->customerDistrict?->dis_pro_sort_id ?? '',
            'district_sort_id' => $this->customerSubdistrict?->sub_dis_sort_id ?? '',
            // Allocator info (user who created/allocated this customer)
            'allocated_by' => $this->formatAllocatedByData(),
            // Transfer info (dynamically attached by CustomerTransferService)
            'latest_transfer' => $this->latest_transfer ?? null,
        ];
    }

    /**
     * Format manager data consistently
     * @return array|string
     */
    private function formatManagerData()
    {
        if (!$this->cus_manage_by) {
            return [
                'user_id' => '',
                'username' => 'ไม่ได้กำหนด'
            ];
        }

        $manager = $this->cusManageBy;
        if ($manager) {
            return [
                'user_id' => (string) $this->cus_manage_by,
                'username' => $manager->username ?? $manager->user_nickname ?? 'ไม่ทราบชื่อ'
            ];
        }

        // Fallback: if relation load failed but we have user_id
        return [
            'user_id' => (string) $this->cus_manage_by,
            'username' => 'ไม่สามารถโหลดข้อมูลได้'
        ];
    }

    /**
     * Format allocated by data (user who created/allocated this customer)
     * @return string|null
     */
    private function formatAllocatedByData(): ?string
    {
        $allocator = $this->allocatedBy;
        
        if (!$allocator) {
            return null;
        }

        $fullName = trim(($allocator->user_firstname ?? '') . ' ' . ($allocator->user_lastname ?? ''));
        $nickname = $allocator->user_nickname ?? '';
        
        if ($fullName && $nickname) {
            return "{$fullName} ({$nickname})";
        } elseif ($fullName) {
            return $fullName;
        } elseif ($nickname) {
            return $nickname;
        }
        
        return $allocator->username ?? null;
    }
}
