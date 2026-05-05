<?php

namespace App\Services\Accounting\Receipt;

use App\Models\Accounting\DocumentAttachment;
use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\Receipt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Receipt file uploads (payment evidence).
 */
class MediaService
{
    /**
     * Upload one or more evidence files attached to a receipt.
     *
     * @param  array<int, \Illuminate\Http\UploadedFile>  $files
     * @return array{uploaded_files: array<int, array<string, mixed>>, description: ?string, uploaded_by: ?string, uploaded_at: string}
     */
    public function uploadEvidence(string $receiptId, array $files, ?string $description = null, ?string $uploadedBy = null): array
    {
        return DB::transaction(function () use ($receiptId, $files, $description, $uploadedBy) {
            Receipt::findOrFail($receiptId);

            $uploadedFiles = [];

            foreach ($files as $file) {
                $filename = time().'_'.$file->getClientOriginalName();
                $path = $file->storeAs('receipts/evidence', $filename, 'public');

                $attachment = DocumentAttachment::create([
                    'document_type' => 'receipt',
                    'document_id' => $receiptId,
                    'filename' => $filename,
                    'original_filename' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                    'uploaded_by' => $uploadedBy,
                ]);

                $uploadedFiles[] = [
                    'id' => $attachment->id,
                    'filename' => $filename,
                    'original_filename' => $file->getClientOriginalName(),
                    'url' => Storage::url($path),
                    'size' => $file->getSize(),
                ];
            }

            $fileCount = count($files);
            DocumentHistory::logAction(
                'receipt',
                $receiptId,
                'upload_evidence',
                $uploadedBy,
                "Uploaded {$fileCount} evidence file(s)".($description ? ": {$description}" : '')
            );

            return [
                'uploaded_files' => $uploadedFiles,
                'description' => $description,
                'uploaded_by' => $uploadedBy,
                'uploaded_at' => now()->format('Y-m-d\TH:i:s\Z'),
            ];
        });
    }
}
