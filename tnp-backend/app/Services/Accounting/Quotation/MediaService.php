<?php

namespace App\Services\Accounting\Quotation;

use App\Models\Accounting\Quotation;
use App\Models\Accounting\DocumentAttachment;
use App\Models\Accounting\DocumentHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MediaService
{
    /**
     * อัปโหลดหลักฐานการส่ง
     * @param mixed $quotationId
     * @param mixed $files
     * @param mixed $description
     * @param mixed $uploadedBy
     * @return array<string,mixed>
     */
    public function uploadEvidence($quotationId, $files, $description = null, $uploadedBy = null): array
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($quotationId);

            $uploadedFiles = [];

            foreach ($files as $file) {
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('quotations/evidence', $filename, 'public');

                // สร้าง attachment record
                $attachment = DocumentAttachment::create([
                    'document_type' => 'quotation',
                    'document_id' => $quotationId,
                    'filename' => $filename,
                    'original_filename' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                    'uploaded_by' => $uploadedBy
                ]);

                $uploadedFiles[] = [
                    'id' => $attachment->id,
                    'filename' => $filename,
                    'original_filename' => $file->getClientOriginalName(),
                    'url' => Storage::url($path),
                    'size' => $file->getSize()
                ];
            }

            // บันทึก History
            $fileCount = count($files);
            DocumentHistory::logAction(
                'quotation',
                $quotationId,
                'upload_evidence',
                $uploadedBy,
                "อัปโหลดหลักฐาน {$fileCount} ไฟล์" . ($description ? ": {$description}" : "")
            );

            DB::commit();

            return [
                'uploaded_files' => $uploadedFiles,
                'description' => $description,
                'uploaded_by' => $uploadedBy,
                'uploaded_at' => now()->format('Y-m-d\TH:i:s\Z')
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::uploadEvidence error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อัปโหลดรูปหลักฐานการเซ็น (เฉพาะใบเสนอราคาที่ Approved แล้ว)
     * @param mixed $quotationId
     * @param mixed $files
     * @param mixed $uploadedBy
     * @return array<string,mixed>
     */
    public function uploadSignatures($quotationId, $files, $uploadedBy = null): array
    {
        try {
            DB::beginTransaction();

            /** @var Quotation $quotation */
            $quotation = Quotation::findOrFail($quotationId);
            if ($quotation->status !== 'approved') {
                throw new \Exception('อัปโหลดได้เฉพาะใบเสนอราคาที่อนุมัติแล้ว');
            }

            $existing = is_array($quotation->signature_images) ? $quotation->signature_images : [];
            $stored = [];

            if (!is_array($files) && !($files instanceof \Traversable)) {
                throw new \Exception('รูปแบบไฟล์ไม่ถูกต้อง (expected array)');
            }

            foreach ($files as $file) {
                if (!$file) { continue; }
                $ext = $file->getClientOriginalExtension();
                $safeExt = strtolower($ext ?: 'jpg');
                $filename = date('Ymd_His') . '_' . \Illuminate\Support\Str::random(8) . '.' . $safeExt;
                $path = $file->storeAs('public/images/quotation', $filename); // storage/app/public/images/quotation
                // Use full absolute URL (handles APP_URL). Storage::url may return relative if APP_URL unset.
                $relative = str_replace('public/', '', $path); // images/quotation/...
                $publicUrl = url('storage/' . $relative);
                $stored[] = [
                    'filename' => $filename,
                    'path' => $path,
                    'url' => $publicUrl,
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                    'uploaded_at' => now()->toIso8601String(),
                    'uploaded_by' => $uploadedBy,
                ];
            }

            $quotation->signature_images = array_values(array_merge($existing, $stored));
            $quotation->save();

            // History
            DocumentHistory::logAction(
                'quotation',
                $quotationId,
                'upload_signatures',
                $uploadedBy,
                'อัปโหลดรูปหลักฐานการเซ็นจำนวน ' . count($files) . ' ไฟล์'
            );

            DB::commit();

            return [
                'signature_images' => $quotation->signature_images,
                'uploaded_count' => count($files),
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::uploadSignatures error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ลบรูปหลักฐานการเซ็น 1 รูปโดยอ้างอิง filename หรือ index
     * @param mixed $quotationId
     * @param mixed $identifier
     * @param mixed $deletedBy
     * @return array<string,mixed>
     */
    public function deleteSignatureImage($quotationId, $identifier, $deletedBy = null): array
    {
        try {
            DB::beginTransaction();

            /** @var Quotation $quotation */
            $quotation = Quotation::findOrFail($quotationId);
            $images = is_array($quotation->signature_images) ? $quotation->signature_images : [];
            if (empty($images)) {
                throw new \Exception('ไม่พบรูปสำหรับลบ');
            }

            $removed = null;
            // Identifier may be numeric index or filename
            if (is_numeric($identifier)) {
                $idx = (int)$identifier;
                if ($idx < 0 || $idx >= count($images)) {
                    throw new \Exception('ตำแหน่งรูปไม่ถูกต้อง');
                }
                $removed = $images[$idx];
                unset($images[$idx]);
            } else {
                foreach ($images as $i => $img) {
                    if (($img['filename'] ?? null) === $identifier) {
                        $removed = $img;
                        unset($images[$i]);
                        break;
                    }
                }
                if (!$removed) {
                    throw new \Exception('ไม่พบไฟล์ที่ระบุ');
                }
            }

            // Delete actual stored file if still exists
            if (!empty($removed['path']) && Storage::exists($removed['path'])) {
                try { Storage::delete($removed['path']); } catch (\Throwable $t) { /* ignore */ }
            }

            $quotation->signature_images = array_values($images);
            $quotation->save();

            DocumentHistory::logAction(
                'quotation',
                $quotationId,
                'delete_signature_image',
                $deletedBy,
                'ลบรูปหลักฐานการเซ็น: ' . ($removed['filename'] ?? 'unknown')
            );

            DB::commit();
            return [
                'deleted' => $removed,
                'signature_images' => $quotation->signature_images,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::deleteSignatureImage error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Upload sample images and append to quotation->sample_images
     * Files are stored under storage/app/public/images/quotation-samples
     * @param mixed $quotationId
     * @param mixed $files
     * @param mixed $uploadedBy
     * @return array<string,mixed>
     */
    public function uploadSampleImages($quotationId, $files, $uploadedBy = null): array
    {
        try {
            DB::beginTransaction();

            /** @var Quotation $quotation */
            $quotation = Quotation::findOrFail($quotationId);

            $existing = is_array($quotation->sample_images) ? $quotation->sample_images : [];
            $stored = [];

            if (!is_array($files) && !($files instanceof \Traversable)) {
                throw new \Exception('Invalid files payload (expected array)');
            }

            foreach ($files as $file) {
                if (!$file) { continue; }
                $ext = $file->getClientOriginalExtension();
                $safeExt = strtolower($ext ?: 'jpg');
                $filename = date('Ymd_His') . '_' . \Illuminate\Support\Str::random(8) . '.' . $safeExt;
                $path = $file->storeAs('public/images/quotation-samples', $filename);
                $relative = str_replace('public/', '', $path); // images/quotation-samples/...
                $publicUrl = url('storage/' . $relative);
                $stored[] = [
                    'filename' => $filename,
                    'original_filename' => $file->getClientOriginalName(),
                    'path' => $path,
                    'url' => $publicUrl,
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                    'uploaded_at' => now()->toIso8601String(),
                    'uploaded_by' => $uploadedBy,
                ];
            }

            $quotation->sample_images = array_values(array_merge($existing, $stored));
            $quotation->save();

            DocumentHistory::logAction(
                'quotation',
                $quotationId,
                'upload_sample_images',
                $uploadedBy,
                'อัปโหลดรูปภาพตัวอย่างจำนวน ' . count($stored) . ' ไฟล์'
            );

            DB::commit();

            return [
                'sample_images' => $quotation->sample_images,
                'uploaded_count' => count($stored),
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::uploadSampleImages error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Upload sample images without persisting to any quotation (for create form)
     * @param mixed $files
     * @param mixed $uploadedBy
     * @return array<string,mixed>
     */
    public function uploadSampleImagesNoBind($files, $uploadedBy = null): array
    {
        try {
            $stored = [];
            if (!is_array($files) && !($files instanceof \Traversable)) {
                throw new \Exception('Invalid files payload (expected array)');
            }
            foreach ($files as $file) {
                if (!$file) { continue; }
                $ext = $file->getClientOriginalExtension();
                $safeExt = strtolower($ext ?: 'jpg');
                $filename = date('Ymd_His') . '_' . \Illuminate\Support\Str::random(8) . '.' . $safeExt;
                $path = $file->storeAs('public/images/quotation-samples', $filename);
                $relative = str_replace('public/', '', $path);
                $publicUrl = url('storage/' . $relative);
                $stored[] = [
                    'filename' => $filename,
                    'original_filename' => $file->getClientOriginalName(),
                    'path' => $path,
                    'url' => $publicUrl,
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                    'uploaded_at' => now()->toIso8601String(),
                    'uploaded_by' => $uploadedBy,
                ];
            }
            return [
                'sample_images' => $stored,
                'uploaded_count' => count($stored),
            ];
        } catch (\Exception $e) {
            Log::error('QuotationService::uploadSampleImagesNoBind error: ' . $e->getMessage());
            throw $e;
        }
    }
}
