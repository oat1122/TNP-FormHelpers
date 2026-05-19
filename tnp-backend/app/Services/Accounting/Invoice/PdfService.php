<?php

namespace App\Services\Accounting\Invoice;

use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\Invoice;
use App\Services\Accounting\Pdf\InvoicePdfMasterService;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Invoice PDF orchestration:
 *   - generate / stream / bundle (with optional ZIP)
 *   - system status check + recommendations
 *
 * Renders are delegated to InvoicePdfMasterService (mPDF). A text-dummy
 * fallback exists for emergencies when mPDF setup is missing — flagged in
 * audit M6.1 for future removal.
 */
class PdfService
{
    public function __construct(
        private InvoicePdfMasterService $pdfMasterService,
    ) {}

    /**
     * Generate an invoice PDF and persist it to storage. Returns metadata
     * (path, url, filename, size, type, engine) for the caller.
     *
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function generatePdf(string $invoiceId, array $options = []): array
    {
        try {
            $invoice = Invoice::with([
                'items',
                'quotation',
                'quotation.items',
                'customer',
                'company',
                'creator',
                'manager',
                'referenceInvoice',
            ])->findOrFail($invoiceId);

            $isFinal = in_array($invoice->status, ['approved', 'sent', 'partial_paid', 'fully_paid', 'completed']);

            try {
                $result = $this->pdfMasterService->generatePdf($invoice, $options);

                DocumentHistory::logAction(
                    'invoice',
                    $invoiceId,
                    'generate_pdf',
                    auth()->user()->user_uuid ?? null,
                    "สร้าง PDF (mPDF): {$result['filename']} ({$result['type']})"
                );

                $result['engine'] = 'mPDF';

                return $result;

            } catch (\Throwable $e) {
                Log::warning('Invoice\\PdfService::generatePdf mPDF failed, fallback to simple PDF: '.$e->getMessage());

                // Fallback path — text dummy. Flagged M6.1 for removal once
                // mPDF setup is verified across all environments.
                $filename = "invoice-{$invoice->number}-".now()->format('Y-m-d-His').'.pdf';
                $pdfPath = storage_path("app/public/pdfs/invoices/{$filename}");

                $directory = dirname($pdfPath);
                if (! file_exists($directory)) {
                    mkdir($directory, 0755, true);
                }

                $content = $this->generateFallbackContent($invoice);
                file_put_contents($pdfPath, $content);

                $fileSize = filesize($pdfPath);
                $pdfUrl = url("storage/pdfs/invoices/{$filename}");

                DocumentHistory::logAction(
                    'invoice',
                    $invoiceId,
                    'generate_pdf',
                    auth()->user()->user_uuid ?? null,
                    "สร้าง PDF (fallback): {$filename} - ".$e->getMessage()
                );

                return [
                    'url' => $pdfUrl,
                    'filename' => $filename,
                    'size' => $fileSize,
                    'path' => $pdfPath,
                    'type' => $isFinal ? 'final' : 'preview',
                    'engine' => 'fallback',
                ];
            }

        } catch (\Exception $e) {
            Log::error('Invoice\\PdfService::generatePdf error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Stream a generated invoice PDF (browser inline view / download).
     */
    public function streamPdf(string $invoiceId, mixed $options = []): Response
    {
        try {
            $invoice = Invoice::with([
                'items',
                'quotation',
                'quotation.items',
                'customer',
                'company',
                'creator',
                'manager',
                'referenceInvoice',
            ])->findOrFail($invoiceId);

            return $this->pdfMasterService->streamPdf($invoice, $options);

        } catch (\Throwable $e) {
            Log::warning('Invoice\\PdfService::streamPdf mPDF failed: '.$e->getMessage());

            $invoice = Invoice::with(['quotation', 'customer'])->findOrFail($invoiceId);
            $content = $this->generateFallbackContent($invoice);
            $filename = sprintf('invoice-%s.pdf', $invoice->number ?? $invoice->id);

            return response($content)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="'.$filename.'"');
        }
    }

    /**
     * Generate one or more PDFs (multi-header) and optionally bundle them
     * into a single ZIP. Single-header path returns mode='single' shape.
     *
     * @param  array<int, string>  $headerTypes
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function generatePdfBundle(string $invoiceId, array $headerTypes = [], array $options = []): array
    {
        try {
            $invoice = Invoice::with([
                'items',
                'quotation',
                'quotation.items',
                'customer',
                'company',
                'creator',
                'manager',
                'referenceInvoice',
            ])->findOrFail($invoiceId);

            // Single-header → reuse generatePdf().
            if (empty($headerTypes) || count($headerTypes) === 1) {
                $singleType = ! empty($headerTypes) ? $headerTypes[0] : null;
                if ($singleType) {
                    $options['document_header_type'] = $singleType;
                }

                $result = $this->generatePdf($invoiceId, $options);

                return [
                    'mode' => 'single',
                    'pdf_url' => $result['url'] ?? null,
                    'filename' => $result['filename'] ?? null,
                    'size' => $result['size'] ?? null,
                    'header_type' => $singleType,
                    'engine' => $result['engine'] ?? 'mPDF',
                    'data' => $result,
                ];
            }

            // Multi-header generation.
            $files = [];

            foreach ($headerTypes as $headerType) {
                if (! is_string($headerType) || trim($headerType) === '') {
                    continue;
                }

                $localOptions = array_merge($options, ['document_header_type' => $headerType]);

                $pdfData = $this->pdfMasterService->generatePdf($invoice, $localOptions);

                $files[] = [
                    'type' => $headerType,
                    'path' => $pdfData['path'],
                    'filename' => $pdfData['filename'],
                    'size' => $pdfData['size'],
                    'url' => $pdfData['url'],
                ];
            }

            if (count($files) === 0) {
                throw new \Exception('No valid header types generated');
            }

            // Single resulting file → return single shape.
            if (count($files) === 1) {
                $file = $files[0];

                DocumentHistory::logAction(
                    'invoice',
                    $invoiceId,
                    'generate_pdf_bundle',
                    auth()->user()->user_uuid ?? null,
                    "สร้าง PDF (single): {$file['filename']} ({$file['type']})"
                );

                return [
                    'mode' => 'single',
                    'pdf_url' => $file['url'],
                    'filename' => $file['filename'],
                    'size' => $file['size'],
                    'header_type' => $file['type'],
                    'files' => $files,
                ];
            }

            $zipResult = $this->createZipFromFiles($invoice, $files, $options);

            DocumentHistory::logAction(
                'invoice',
                $invoiceId,
                'generate_pdf_bundle',
                auth()->user()->user_uuid ?? null,
                'สร้าง ZIP รวม '.count($files)." ไฟล์ PDF: {$zipResult['filename']}"
            );

            return array_merge($zipResult, [
                'mode' => 'zip',
                'files' => $files,
                'count' => count($files),
            ]);

        } catch (\Exception $e) {
            Log::error('Invoice\\PdfService::generatePdfBundle error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Probe the PDF subsystem (mPDF binary, Thai fonts, output directory)
     * and emit installation hints on missing pieces.
     *
     * @return array<string, mixed>
     */
    public function checkPdfSystemStatus(): array
    {
        try {
            $status = $this->pdfMasterService->checkSystemStatus();

            return [
                'system_ready' => $status['all_ready'],
                'components' => $status,
                'recommendations' => $this->getPdfRecommendations($status),
                'preferred_engine' => $status['all_ready'] ? 'mPDF' : 'fallback',
            ];

        } catch (\Exception $e) {
            Log::error('Invoice\\PdfService::checkPdfSystemStatus error: '.$e->getMessage());

            return [
                'system_ready' => false,
                'components' => ['error' => $e->getMessage()],
                'recommendations' => ['ติดตั้ง mPDF package และ dependencies ที่จำเป็น'],
                'preferred_engine' => 'fallback',
            ];
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $files
     * @param  array<string, mixed>  $options
     * @return array{zip_url: string, zip_filename: string, zip_size: int, zip_path: string}
     */
    private function createZipFromFiles(Invoice $invoice, array $files, array $options = []): array
    {
        $zipDir = storage_path('app/public/pdfs/invoices/zips');
        if (! is_dir($zipDir)) {
            @mkdir($zipDir, 0755, true);
        }

        $mode = $options['deposit_mode'] ?? 'before';
        $modeLabel = $mode === 'after' ? 'after-deposit' : 'before-deposit';
        $zipName = sprintf(
            'invoice-%s-multi-%s-%s.zip',
            $invoice->number ?? $invoice->id,
            $modeLabel,
            now()->format('YmdHis')
        );

        $zipPath = $zipDir.DIRECTORY_SEPARATOR.$zipName;

        $zip = new \ZipArchive;
        if ($zip->open($zipPath, \ZipArchive::CREATE) !== true) {
            throw new \Exception('ไม่สามารถสร้างไฟล์ ZIP ได้');
        }

        foreach ($files as $file) {
            if (isset($file['path']) && is_file($file['path'])) {
                $baseName = $file['filename'] ?? basename($file['path']);
                $zip->addFile($file['path'], $baseName);
            }
        }

        $zip->close();

        $zipUrl = url('storage/pdfs/invoices/zips/'.$zipName);
        $zipSize = is_file($zipPath) ? filesize($zipPath) : 0;

        return [
            'zip_url' => $zipUrl,
            'zip_filename' => $zipName,
            'zip_size' => $zipSize,
            'zip_path' => $zipPath,
        ];
    }

    /**
     * @param  array<string, mixed>  $status
     * @return array<string>
     */
    private function getPdfRecommendations(array $status): array
    {
        $recommendations = [];

        if (! ($status['mpdf'] ?? false)) {
            $recommendations[] = 'ติดตั้ง mPDF: composer require mpdf/mpdf';
        }

        if (! ($status['thai_fonts'] ?? false)) {
            $recommendations[] = 'ดาวน์โหลดฟอนต์ Sarabun และวางไว้ใน public/fonts/thsarabun/';
        }

        if (! ($status['temp_dir'] ?? false)) {
            $recommendations[] = 'ตรวจสอบสิทธิ์การเขียนไฟล์ใน storage/app/mpdf-temp/';
        }

        if (! ($status['output_dir'] ?? false)) {
            $recommendations[] = 'ตรวจสอบสิทธิ์การเขียนไฟล์ใน storage/app/public/pdfs/invoices/';
        }

        return $recommendations;
    }

    /**
     * Text-dummy fallback content. M6.1 candidate for removal.
     */
    private function generateFallbackContent(Invoice $invoice): string
    {
        return "
TNP GROUP
ใบแจ้งหนี้ {$invoice->number}

ลูกค้า: {$invoice->customer_company}
เลขภาษี: {$invoice->customer_tax_id}
ที่อยู่: {$invoice->customer_address}

รายละเอียดงาน:
{$invoice->work_name}
จำนวน: {$invoice->quantity}

ราคา:
ยอดก่อนภาษี: ".number_format($invoice->subtotal, 2).' บาท
ภาษีมูลค่าเพิ่ม: '.number_format($invoice->tax_amount, 2).' บาท
ยอดรวม: '.number_format($invoice->total_amount, 2)." บาท

เงื่อนไขการชำระ: {$invoice->payment_terms}
วันครบกำหนด: {$invoice->due_date}

หมายเหตุ:
{$invoice->notes}

วันที่: ".now()->format('d/m/Y').'
';
    }
}
