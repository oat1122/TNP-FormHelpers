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
            'cus_manage_by' => $this->cus_manage_by ? $this->cusManageBy : '',
            'cus_is_use' => $this->cus_is_use,
            'cd_id' => $this->customerDetail?->cd_id,
            'cd_last_datetime' => $this->customerDetail?->cd_last_datetime ?? '',
            'cd_note' => $this->customerDetail?->cd_note ?? '',
            'cd_remark' => $this->customerDetail?->cd_remark ?? '',
            'cus_created_date' => $this->cus_created_date,
            'sales_name' => $this->cus_manage_by ? $this->cusManageBy->username : '',
            'province_sort_id' => $this->customerDistrict?->dis_pro_sort_id ?? '',
            'district_sort_id' => $this->customerSubdistrict?->sub_dis_sort_id ?? '',
        ];
    }
}
