<?php

namespace App\Http\Resources\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, // Uses accessor from Product model
            'name' => $this->name, // Uses accessor
            'description' => $this->description, // Uses accessor
            'is_active' => $this->is_active, // Uses accessor
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            
            // Raw database fields for reference
            'raw_data' => [
                'mpc_id' => $this->mpc_id,
                'mpc_name' => $this->mpc_name,
                'mpc_remark' => $this->mpc_remark,
                'mpc_is_deleted' => $this->mpc_is_deleted,
            ],
        ];
    }
}
