<?php

namespace App\Http\Resources\MaxSupply;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaxSupplyResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'worksheet_id' => $this->worksheet_id,
            'production_code' => $this->production_code,
            'customer_name' => $this->customer_name,
            'product_name' => $this->product_name,
            'quantity' => $this->quantity,
            'print_points' => $this->print_points,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'status' => $this->status,
            'status_color' => $this->status_color,
            'priority' => $this->priority,
            'priority_color' => $this->priority_color,
            'notes' => $this->notes,
            'additional_data' => $this->additional_data,
            'duration' => $this->duration,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            
            // Relationships
            'creator' => $this->whenLoaded('creator', function () {
                return [
                    'id' => $this->creator->id,
                    'name' => $this->creator->name,
                    'email' => $this->creator->email,
                ];
            }),
            
            'updater' => $this->whenLoaded('updater', function () {
                return [
                    'id' => $this->updater->id,
                    'name' => $this->updater->name,
                    'email' => $this->updater->email,
                ];
            }),
            
            'files' => $this->whenLoaded('files', function () {
                return $this->files->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'original_name' => $file->original_name,
                        'stored_name' => $file->stored_name,
                        'file_path' => $file->file_path,
                        'file_type' => $file->file_type,
                        'mime_type' => $file->mime_type,
                        'file_size' => $file->file_size,
                        'formatted_size' => $file->formatted_size,
                        'description' => $file->description,
                        'url' => $file->url,
                        'is_image' => $file->is_image,
                        'is_document' => $file->is_document,
                        'uploaded_at' => $file->created_at?->format('Y-m-d H:i:s'),
                        'uploader' => [
                            'id' => $file->uploader?->id,
                            'name' => $file->uploader?->name,
                        ],
                    ];
                });
            }),
            
            'logs' => $this->whenLoaded('logs', function () {
                return $this->logs->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'action' => $log->action,
                        'description' => $log->description,
                        'formatted_changes' => $log->formatted_changes,
                        'created_at' => $log->created_at?->format('Y-m-d H:i:s'),
                        'user' => [
                            'id' => $log->user?->id,
                            'name' => $log->user?->name,
                        ],
                    ];
                });
            }),
        ];
    }
}
