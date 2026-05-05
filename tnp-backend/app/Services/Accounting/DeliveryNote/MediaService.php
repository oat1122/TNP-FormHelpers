<?php

namespace App\Services\Accounting\DeliveryNote;

use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\DocumentAttachment;
use App\Models\Accounting\DocumentHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Delivery-note evidence file uploads.
 */
class MediaService
{
    /**
     * Persist evidence files for a delivery note + record DocumentAttachment
     * rows + emit a single history entry.
     *
     * @param  array<int, \Illuminate\Http\UploadedFile>  $files
     * @return array<int, DocumentAttachment>
     */
    public function uploadEvidence(string $deliveryNoteId, array $files, ?string $description = null, ?string $uploadedBy = null): array
    {
        return DB::transaction(function () use ($deliveryNoteId, $files, $uploadedBy) {
            $deliveryNote = DeliveryNote::findOrFail($deliveryNoteId);
            $uploadedFiles = [];

            foreach ($files as $file) {
                $filename = time().'_'.Str::random(10).'.'.$file->getClientOriginalExtension();
                $path = $file->storeAs('delivery_notes/evidence', $filename, 'public');

                $attachment = new DocumentAttachment;
                $attachment->id = (string) Str::uuid();
                $attachment->document_type = 'delivery_note';
                $attachment->document_id = $deliveryNote->id;
                $attachment->filename = $filename;
                $attachment->original_filename = $file->getClientOriginalName();
                $attachment->file_path = $path;
                $attachment->file_size = $file->getSize();
                $attachment->mime_type = $file->getMimeType();
                $attachment->uploaded_by = $uploadedBy;
                $attachment->save();

                $uploadedFiles[] = $attachment;
            }

            DocumentHistory::logAction(
                'delivery_note',
                $deliveryNote->id,
                'evidence_uploaded',
                $uploadedBy,
                'อัปโหลดหลักฐานการจัดส่ง: '.count($files).' ไฟล์'
            );

            return $uploadedFiles;
        });
    }
}
