<?php

namespace App\Http\Resources\V1\Feedback;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EncouragingMessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'em_id' => $this->em_id,
            'em_content' => $this->em_content,
            'em_category' => $this->em_category,
        ];
    }
}
