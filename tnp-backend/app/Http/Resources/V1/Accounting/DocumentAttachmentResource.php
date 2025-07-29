<?php

namespace App\Http\Resources\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentAttachmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'document_type' => $this->document_type,
            'document_id' => $this->document_id,
            'file_name' => $this->file_name,
            'file_size' => $this->file_size,
            'file_size_formatted' => $this->getFormattedFileSize(),
            'mime_type' => $this->mime_type,
            'description' => $this->description,
            'uploaded_by' => $this->uploaded_by,
            'uploader' => new UserResource($this->whenLoaded('uploadedBy')),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'download_url' => route('api.v1.accounting.attachments.download', ['id' => $this->id]),
            'file_icon' => $this->getFileIcon(),
        ];
    }

    /**
     * Get formatted file size
     */
    private function getFormattedFileSize(): string
    {
        $bytes = $this->file_size;
        
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' bytes';
        }
    }

    /**
     * Get file icon based on mime type
     */
    private function getFileIcon(): string
    {
        $mimeType = $this->mime_type;
        
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        } elseif ($mimeType === 'application/pdf') {
            return 'pdf';
        } elseif (str_contains($mimeType, 'word') || str_contains($mimeType, 'document')) {
            return 'document';
        } elseif (str_contains($mimeType, 'excel') || str_contains($mimeType, 'spreadsheet')) {
            return 'spreadsheet';
        } else {
            return 'file';
        }
    }
}
