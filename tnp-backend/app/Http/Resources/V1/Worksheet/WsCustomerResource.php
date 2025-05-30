<?php

namespace App\Http\Resources\V1\Worksheet;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WsCustomerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $fullname_result = trim(($this->cus_firstname ?? '') . ' ' . ($this->cus_lastname ?? ''));

        return [
            'cus_id' => $this->cus_id,
            'cus_name' => $this->cus_name,
            'cus_fullname' => $fullname_result,
            'cus_company' => $this->cus_company ?? '',
            'cus_address' => $this->cus_address ?? '',
            'cus_tel_1' => $this->cus_tel_1 ?? '',
            'cus_email' => $this->cus_email ?? '',
        ];
    }
}
