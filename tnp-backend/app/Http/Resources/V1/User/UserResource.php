<?php

namespace App\Http\Resources\V1\User;

// use App\Services\PricingService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'user_id' => $this->user_id,
            'user_uuid' => $this->user_uuid,
            'username' => $this->username ?? '',
            'role' => $this->role ?? '',
            'user_emp_no' => $this->user_emp_no ?? '',
            'user_firstname' => $this->user_firstname ?? '',
            'user_lastname' => $this->user_lastname ?? '',
            'user_phone' => $this->user_phone ?? '',
            'user_nickname' => $this->user_nickname ?? '',
            'user_position' => $this->user_position ?? '',
            'enable' => $this->enable ?? '',
            'user_is_enable' => $this->user_is_enable ?? '',
            'user_created_date' => $this->user_created_date ?? null,
            'user_created_by' => $this->user_created_by ?? '',
            'user_updated_date' => $this->user_updated_date ?? null,
            'user_updated_by' => $this->user_updated_by ?? '',
        ];
    }
}
