<?php

namespace App\Services\Accounting;

use App\Models\Accounting\DocumentStatusHistory;
use App\Models\Accounting\DocumentAttachment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class DocumentService
{
    /**
     * Record document status change
     */
    public function recordStatusHistory(
        string $documentType,
        string $documentId,
        string $status,
        string $notes = null,
        string $userId = null
    ): DocumentStatusHistory {
        return DocumentStatusHistory::create([
            'document_type' => $documentType,
            'document_id' => $documentId,
            'status' => $status,
            'notes' => $notes,
            'changed_by' => $userId ?: Auth::id(),
            'changed_at' => now()
        ]);
    }

    /**
     * Upload document attachment
     */
    public function uploadAttachment(
        string $documentType,
        string $documentId,
        UploadedFile $file,
        string $description = null
    ): DocumentAttachment {
        // Validate file type and size
        $this->validateFile($file);

        // Generate unique filename
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;

        // Define storage path
        $path = "documents/{$documentType}/{$documentId}";
        
        // Store file
        $filePath = $file->storeAs($path, $filename, 'private');

        // Create attachment record
        return DocumentAttachment::create([
            'document_type' => $documentType,
            'document_id' => $documentId,
            'file_name' => $originalName,
            'file_path' => $filePath,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'description' => $description,
            'uploaded_by' => Auth::id()
        ]);
    }

    /**
     * Download document attachment
     */
    public function downloadAttachment(string $attachmentId)
    {
        $attachment = DocumentAttachment::find($attachmentId);

        if (!$attachment) {
            throw new \Exception('Attachment not found');
        }

        if (!Storage::disk('private')->exists($attachment->file_path)) {
            throw new \Exception('File not found on storage');
        }

        return Storage::disk('private')->download($attachment->file_path, $attachment->file_name);
    }

    /**
     * Delete document attachment
     */
    public function deleteAttachment(string $attachmentId): bool
    {
        $attachment = DocumentAttachment::find($attachmentId);

        if (!$attachment) {
            throw new \Exception('Attachment not found');
        }

        // Delete file from storage
        if (Storage::disk('private')->exists($attachment->file_path)) {
            Storage::disk('private')->delete($attachment->file_path);
        }

        // Delete attachment record
        return $attachment->delete();
    }

    /**
     * Get document attachments
     */
    public function getAttachments(string $documentType, string $documentId)
    {
        return DocumentAttachment::where('document_type', $documentType)
                                 ->where('document_id', $documentId)
                                 ->with('uploadedBy')
                                 ->orderBy('created_at', 'desc')
                                 ->get();
    }

    /**
     * Get document status history
     */
    public function getStatusHistory(string $documentType, string $documentId)
    {
        return DocumentStatusHistory::where('document_type', $documentType)
                                   ->where('document_id', $documentId)
                                   ->with('changedBy')
                                   ->orderBy('changed_at', 'desc')
                                   ->get();
    }

    /**
     * Validate uploaded file
     */
    private function validateFile(UploadedFile $file): void
    {
        // Define allowed file types
        $allowedMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
        ];

        // Check file type
        if (!in_array($file->getMimeType(), $allowedMimeTypes)) {
            throw new \Exception('File type not allowed. Allowed types: PDF, Images, Word, Excel, Text files');
        }

        // Check file size (max 10MB)
        $maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if ($file->getSize() > $maxSize) {
            throw new \Exception('File size too large. Maximum size is 10MB');
        }
    }

    /**
     * Generate file URL for download
     */
    public function getAttachmentUrl(string $attachmentId): string
    {
        return route('api.v1.accounting.attachments.download', ['id' => $attachmentId]);
    }

    /**
     * Bulk delete attachments for a document
     */
    public function deleteDocumentAttachments(string $documentType, string $documentId): bool
    {
        $attachments = DocumentAttachment::where('document_type', $documentType)
                                        ->where('document_id', $documentId)
                                        ->get();

        foreach ($attachments as $attachment) {
            // Delete file from storage
            if (Storage::disk('private')->exists($attachment->file_path)) {
                Storage::disk('private')->delete($attachment->file_path);
            }
        }

        // Delete all attachment records
        return DocumentAttachment::where('document_type', $documentType)
                                ->where('document_id', $documentId)
                                ->delete();
    }

    /**
     * Get storage statistics for a document type
     */
    public function getStorageStats(string $documentType = null): array
    {
        $query = DocumentAttachment::query();
        
        if ($documentType) {
            $query->where('document_type', $documentType);
        }

        $stats = $query->selectRaw('
            COUNT(*) as total_files,
            SUM(file_size) as total_size,
            AVG(file_size) as average_size,
            MAX(file_size) as max_size,
            MIN(file_size) as min_size
        ')->first();

        return [
            'total_files' => $stats->total_files ?? 0,
            'total_size' => $stats->total_size ?? 0,
            'total_size_mb' => round(($stats->total_size ?? 0) / 1024 / 1024, 2),
            'average_size' => $stats->average_size ?? 0,
            'max_size' => $stats->max_size ?? 0,
            'min_size' => $stats->min_size ?? 0
        ];
    }
}
