<?php

namespace App\Http\Resources\V1\Feedback;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeedbackReportResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Show who created the report only if it's not anonymous
        $creator = null;
        if (!$this->fr_is_anonymous && $this->createdBy) {
            $creator = [
                'user_uuid' => $this->createdBy->user_uuid,
                'username' => $this->createdBy->username,
                'nickname' => $this->createdBy->user_nickname
            ];
        }
        
        // For image URL
        $imageUrl = $this->fr_image ? url('storage/images/feedback/' . $this->fr_image) : null;

        return [
            'fr_id' => $this->fr_id,
            'fr_content' => $this->fr_content,
            'fr_category' => $this->fr_category,
            'fr_priority' => $this->fr_priority,
            'fr_resolved' => $this->fr_resolved,
            'fr_is_anonymous' => $this->fr_is_anonymous,
            'fr_image' => $imageUrl,
            'fr_created_date' => $this->fr_created_date,
            'fr_created_by' => $creator, // Only populated if not anonymous
            'fr_admin_response' => $this->fr_admin_response,
            'fr_response_date' => $this->fr_response_date,
            'fr_response_by' => $this->respondedBy ? [
                'user_uuid' => $this->respondedBy->user_uuid,
                'username' => $this->respondedBy->username,
                'nickname' => $this->respondedBy->user_nickname
            ] : null,
        ];
    }
}
