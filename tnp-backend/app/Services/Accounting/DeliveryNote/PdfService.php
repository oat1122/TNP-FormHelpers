<?php

namespace App\Services\Accounting\DeliveryNote;

use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\DocumentHistory;
use App\Services\Accounting\Pdf\DeliveryNotePdfMasterService;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Delivery-note PDF orchestration: generate / stream / multi-header bundle
 * (with optional ZIP). Renders are delegated to DeliveryNotePdfMasterService
 * (mPDF) which is constructor-injected (M2 pattern).
 */
class PdfService
{
    public function __construct(
        private DeliveryNotePdfMasterService $pdfMasterService,
    ) {}

    /**
     * Render a single delivery-note PDF and return its metadata.
     *
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function generatePdf(string $deliveryNoteId, array $options = []): array
    {
        try {
            $deliveryNote = DeliveryNote::with([
                'company', 'receipt', 'customer', 'creator', 'manager', 'deliveryPerson', 'items',
            ])->findOrFail($deliveryNoteId);

            $result = $this->pdfMasterService->generatePdf($deliveryNote, $options);

            // History log is best-effort — never block PDF return on a log
            // failure (the file was already produced successfully).
            try {
                DocumentHistory::logAction(
                    'delivery_note',
                    $deliveryNote->id,
                    'generate_pdf',
                    auth()->user()->user_uuid ?? null,
                    'สร้าง PDF (mPDF): '.$result['filename'].' ('.$result['type'].')'
                );
            } catch (\Throwable $logE) {
                Log::warning('Invoice\\DeliveryNote\\PdfService::generatePdf history log failed: '.$logE->getMessage());
            }

            return [
                'url' => $result['url'],
                'path' => $result['path'],
                'filename' => $result['filename'],
                'size' => $result['size'],
                'engine' => 'mPDF',
                'type' => $result['type'],
            ];

        } catch (\Exception $e) {
            Log::error('DeliveryNote\\PdfService::generatePdf error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Render one or more PDFs (multi-header) and bundle into a ZIP when more
     * than one. Single-header path returns mode='single' shape.
     *
     * @param  array<int, string>  $headerTypes
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function generatePdfBundle(string $deliveryNoteId, array $headerTypes = [], array $options = []): array
    {
        try {
            $deliveryNote = DeliveryNote::with([
                'company', 'receipt', 'customer', 'creator', 'manager', 'deliveryPerson', 'items',
            ])->findOrFail($deliveryNoteId);

            if (empty($headerTypes)) {
                $headerTypes = ['ต้นฉบับ'];
            }

            $files = [];
            foreach ($headerTypes as $headerType) {
                $pdfOptions = array_merge($options, ['document_header_type' => $headerType]);
                $files[] = $this->pdfMasterService->generatePdf($deliveryNote, $pdfOptions);
            }

            if (count($files) === 1) {
                return [
                    'mode' => 'single',
                    'file' => $files[0],
                ];
            }

            $zipResult = $this->createZipFromFiles($deliveryNote, $files, $options);

            return [
                'mode' => 'zip',
                'zip' => $zipResult,
                'files' => $files,
            ];

        } catch (\Exception $e) {
            Log::error('DeliveryNote\\PdfService::generatePdfBundle error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Stream the rendered PDF for inline display / download.
     */
    public function streamPdf(string $deliveryNoteId, array $options = []): Response
    {
        try {
            $deliveryNote = DeliveryNote::with([
                'company', 'receipt', 'customer', 'creator', 'manager', 'deliveryPerson', 'items',
            ])->findOrFail($deliveryNoteId);

            return $this->pdfMasterService->streamPdf($deliveryNote, $options);

        } catch (\Exception $e) {
            Log::error('DeliveryNote\\PdfService::streamPdf error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $files
     * @param  array<string, mixed>  $options
     * @return array{path: string, url: string, filename: string, size: int}
     */
    private function createZipFromFiles(DeliveryNote $deliveryNote, array $files, array $options = []): array
    {
        $zipDir = storage_path('app/public/pdfs/delivery-notes/zips');
        if (! is_dir($zipDir)) {
            @mkdir($zipDir, 0755, true);
        }

        $zipName = sprintf(
            'delivery-note-%s-bundle-%s.zip',
            $deliveryNote->number ?? $deliveryNote->id,
            date('YmdHis')
        );

        $zipPath = $zipDir.DIRECTORY_SEPARATOR.$zipName;

        $zip = new \ZipArchive;
        if ($zip->open($zipPath, \ZipArchive::CREATE) !== true) {
            throw new \Exception('ไม่สามารถสร้างไฟล์ ZIP ได้');
        }

        foreach ($files as $file) {
            if (is_file($file['path'])) {
                $zip->addFile($file['path'], $file['filename']);
            }
        }

        $zip->close();

        $relativePath = str_replace(storage_path('app/public/'), '', $zipPath);
        $relativePath = str_replace('\\', '/', $relativePath);
        $zipUrl = url('storage/'.$relativePath);
        $zipSize = is_file($zipPath) ? filesize($zipPath) : 0;

        return [
            'path' => str_replace('\\', '/', $zipPath),
            'url' => $zipUrl,
            'filename' => $zipName,
            'size' => $zipSize,
        ];
    }
}
