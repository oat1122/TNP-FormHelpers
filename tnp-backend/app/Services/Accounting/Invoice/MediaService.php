<?php

namespace App\Services\Accounting\Invoice;

use App\Models\Accounting\DocumentAttachment;
use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\Invoice;
use App\Traits\Uploadable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Invoice file uploads (payment evidence — generic + before/after deposit
 * modes) plus the helpers that normalize the structured evidence_files JSON.
 */
class MediaService
{
    use Uploadable;

    /**
     * Upload one or more evidence files attached to an invoice (legacy /
     * generic mode — files default to the 'before' bucket).
     *
     * @param  array<mixed>  $files
     * @return array<string, mixed>
     */
    public function uploadEvidence(string $invoiceId, array $files, ?string $description = null, ?string $uploadedBy = null): array
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if (! $files || ! is_iterable($files)) {
                throw new \Exception('No files received');
            }

            $directory = 'images/invoices/evidence';
            $prefix = 'inv_'.$invoiceId;

            $uploadedFiles = [];
            foreach ($files as $file) {
                if (! $file) {
                    continue;
                }

                $fileData = $this->uploadFile($file, $directory, $prefix, 'public');

                $attachment = DocumentAttachment::create([
                    'document_type' => 'invoice',
                    'document_id' => $invoiceId,
                    'filename' => $fileData['filename'],
                    'original_filename' => $fileData['original_filename'],
                    'file_path' => $fileData['path'],
                    'file_size' => $fileData['size'],
                    'mime_type' => $fileData['mime_type'],
                    'uploaded_by' => $uploadedBy,
                ]);

                $uploadedFiles[] = [
                    'id' => $attachment->id,
                    'filename' => $fileData['filename'],
                    'original_filename' => $fileData['original_filename'],
                    'url' => $fileData['url'],
                    'size' => $fileData['size'],
                    'uploaded_at' => now()->toISOString(),
                    'uploaded_by' => $uploadedBy,
                ];
            }

            DocumentHistory::logAction(
                'invoice',
                $invoiceId,
                'upload_evidence',
                $uploadedBy,
                'อัปโหลดหลักฐาน '.count($uploadedFiles).' ไฟล์'
            );

            DB::commit();

            // Merge & persist into invoice.evidence_files JSON. Default the
            // generic upload to 'before' bucket for consistent presentation.
            $currentEvidence = $this->normalizeEvidenceStructure($invoice->evidence_files);
            foreach ($uploadedFiles as $f) {
                $currentEvidence['before'][] = $f['filename'];
            }
            $currentEvidence['before'] = array_values(array_unique($currentEvidence['before']));
            $currentEvidence['after'] = array_values(array_unique($currentEvidence['after']));

            $invoice->evidence_files = $currentEvidence;
            $invoice->save();

            return [
                'uploaded_files' => $uploadedFiles,
                'evidence_files' => $invoice->evidence_files,
                'description' => $description,
                'uploaded_by' => $uploadedBy,
                'uploaded_at' => now()->format('Y-m-d\TH:i:s\Z'),
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice\\MediaService::uploadEvidence error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Upload evidence for a specific deposit mode (before / after).
     *
     * @param  array<mixed>  $files
     * @return array<string, mixed>
     */
    public function uploadEvidenceByMode(string $invoiceId, array $files, string $mode = 'before', ?string $description = null, ?string $uploadedBy = null): array
    {
        if (! in_array($mode, ['before', 'after'], true)) {
            throw new \InvalidArgumentException('Invalid evidence mode');
        }

        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if (! $files || ! is_iterable($files)) {
                throw new \Exception('No files received');
            }

            $stored = [];
            foreach ($files as $file) {
                if (! $file) {
                    continue;
                }
                $ext = $file->getClientOriginalExtension();
                $original = $file->getClientOriginalName();
                $filename = 'inv_'.$invoiceId.'_'.$mode.'_'.uniqid().'.'.$ext;

                $storagePath = 'images/invoices/evidence';
                $path = $file->storeAs($storagePath, $filename, 'public');
                $normalizedPath = str_replace('\\', '/', $path);

                $stored[] = [
                    'path' => $normalizedPath,
                    'original' => $original,
                    'uploaded_at' => now()->toISOString(),
                    'uploaded_by' => $uploadedBy,
                    'mode' => $mode,
                ];
            }

            $uploadedFiles = [];
            foreach ($stored as $item) {
                $filenameOnly = basename($item['path']);
                $path = $item['path'];

                $storagePath = storage_path('app/public/'.str_replace(['public/', 'public\\'], '', $path));
                $size = file_exists($storagePath) ? filesize($storagePath) : null;
                $mime = $size ? mime_content_type($storagePath) : null;

                $attachment = DocumentAttachment::create([
                    'document_type' => 'invoice',
                    'document_id' => $invoiceId,
                    'filename' => $filenameOnly,
                    'original_filename' => $item['original'],
                    'file_path' => $path,
                    'file_size' => $size,
                    'mime_type' => $mime,
                    'uploaded_by' => $uploadedBy,
                    'metadata' => json_encode(['mode' => $mode]),
                ]);

                $fileUrl = $this->generateFileUrl($path);

                $uploadedFiles[] = [
                    'id' => $attachment->id,
                    'filename' => $filenameOnly,
                    'original_filename' => $item['original'],
                    'url' => $fileUrl,
                    'size' => $size,
                    'mode' => $mode,
                ];
            }

            DocumentHistory::logAction(
                'invoice',
                $invoiceId,
                'upload_evidence_'.$mode,
                $uploadedBy,
                'อัปโหลดหลักฐาน '.count($stored).' ไฟล์ (โหมด: '.$mode.')'
            );

            DB::commit();

            $currentEvidence = $this->normalizeEvidenceStructure($invoice->evidence_files);

            foreach ($uploadedFiles as $f) {
                $currentEvidence[$mode][] = $f['filename'];
            }
            $currentEvidence[$mode] = array_values(array_unique($currentEvidence[$mode]));

            $invoice->evidence_files = $currentEvidence;

            // Status transition logic for evidence upload
            if ($mode === 'after' && $invoice->status === 'pending_after') {
                DocumentHistory::logAction(
                    'invoice',
                    $invoiceId,
                    'evidence_uploaded_pending_after',
                    $uploadedBy,
                    'อัปโหลดหลักฐานมัดจำหลัง - รอการอนุมัติ'
                );
            }

            $invoice->save();

            return [
                'uploaded_files' => $uploadedFiles,
                'evidence_files' => $invoice->evidence_files,
                'mode' => $mode,
                'description' => $description,
                'uploaded_by' => $uploadedBy,
                'uploaded_at' => now()->format('Y-m-d\TH:i:s\Z'),
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice\\MediaService::uploadEvidenceByMode error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Generate proper file URL (works for dev + production).
     */
    private function generateFileUrl(string $path): string
    {
        $cleanPath = str_replace(['public/', 'public\\'], '', $path);
        $cleanPath = str_replace('\\', '/', $cleanPath);

        try {
            return Storage::url($path);
        } catch (\Exception $e) {
            $appUrl = rtrim(config('app.url', request()->getSchemeAndHttpHost()), '/');

            return $appUrl.'/storage/'.$cleanPath;
        }
    }

    /**
     * Normalize evidence_files JSON structure ({before: [], after: []}).
     * Handles legacy flat arrays and corrupted nested structures.
     *
     * @param  mixed  $evidenceData
     * @return array<string, array<string>>
     */
    private function normalizeEvidenceStructure($evidenceData): array
    {
        $normalized = ['before' => [], 'after' => []];

        if (! $evidenceData) {
            return $normalized;
        }

        if (is_string($evidenceData)) {
            $evidenceData = json_decode($evidenceData, true) ?: [];
        }

        // Legacy flat array — treat all entries as 'before'.
        if (is_array($evidenceData) && ! isset($evidenceData['before']) && ! isset($evidenceData['after'])) {
            $normalized['before'] = array_values(array_filter($evidenceData, fn ($item) => is_string($item)));

            return $normalized;
        }

        if ($evidenceData !== null) {
            $data = (array) $evidenceData;

            $beforeFiles = $this->extractFilesFromNestedStructure($data, 'before');
            $afterFiles = $this->extractFilesFromNestedStructure($data, 'after');

            $normalized['before'] = array_values(array_unique(array_filter($beforeFiles, fn ($item) => is_string($item))));
            $normalized['after'] = array_values(array_unique(array_filter($afterFiles, fn ($item) => is_string($item))));
        }

        return $normalized;
    }

    /**
     * Recursively extract files from a nested/corrupted evidence structure.
     *
     * @param  mixed  $data
     * @return array<string>
     */
    private function extractFilesFromNestedStructure($data, string $mode): array
    {
        $files = [];

        if (! is_array($data) && ! is_object($data)) {
            return $files;
        }

        $data = (array) $data;

        if (isset($data[$mode])) {
            if (is_array($data[$mode])) {
                foreach ($data[$mode] as $item) {
                    if (is_string($item) && strpos($item, 'inv_') === 0) {
                        $files[] = $item;
                    } elseif (is_array($item)) {
                        $files = array_merge($files, $this->extractFilesFromNestedStructure($item, $mode));
                    }
                }
            } elseif (is_string($data[$mode]) && strpos($data[$mode], 'inv_') === 0) {
                $files[] = $data[$mode];
            }
        }

        // Look for files in numeric keys (corruption artifacts)
        foreach ($data as $key => $value) {
            if (is_numeric($key) && is_string($value) && strpos($value, 'inv_') === 0) {
                if (strpos($value, "_{$mode}_") !== false) {
                    $files[] = $value;
                }
            }
        }

        // Recursive search in nested objects
        foreach ($data as $value) {
            if (is_array($value)) {
                $files = array_merge($files, $this->extractFilesFromNestedStructure($value, $mode));
            }
        }

        return $files;
    }
}
