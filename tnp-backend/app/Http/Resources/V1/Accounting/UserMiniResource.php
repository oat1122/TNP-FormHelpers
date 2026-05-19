<?php

namespace App\Http\Resources\V1\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Minimal user info for embedding in Accounting responses (creator, manager,
 * approver, deliveryPerson, etc.). Whitelist only fields FE displays.
 *
 * Excludes: password, new_pass, user_emp_no, user_created_by/_date,
 * user_updated_by/_date, deleted/enable flags, pass_is_updated. These are
 * internal or sensitive and FE never reads them.
 */
class UserMiniResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'user_id' => $this->user_id,
            'user_uuid' => $this->user_uuid,
            'username' => $this->username ?? '',
            'role' => $this->role ?? '',
            'user_firstname' => $this->user_firstname ?? '',
            'user_lastname' => $this->user_lastname ?? '',
            'user_nickname' => $this->user_nickname ?? '',
            'user_position' => $this->user_position ?? '',
            'user_phone' => $this->user_phone ?? '',
        ];
    }
}
