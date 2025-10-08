<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\Invoice;
use App\Services\CompanyLogoService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\HTMLParserMode;
use Mpdf\Mpdf;

/**
 * Master PDF Service สำหรับใบเสร็จรับเงิน (Receipt)
 * - ใช้ Body/Styles เดียวกับ Invoice แต่ Header ต่างกัน
 * - Footer และ Signature ใช้ partial ของ Invoice เดิม
 */
class ReceiptPdfMasterService extends InvoicePdfMasterService
{
    /**
     * สร้าง PDF ใบเสร็จรับเงินเป็นไฟล์ พร้อม URL
     * @param Invoice $invoice
     * @param array<string,mixed> $options
     * @return array{path:string,url:string,filename:string,size:int,type:string}
     */
    public function generatePdf(Invoice $invoice, array $options = []): array
    {
        try {
            $viewData = $this->buildViewData($invoice, $options);

            $mpdf = $this->createMpdf($viewData);

            $filePath = $this->savePdfFile($mpdf, $viewData['invoice'], $viewData['options'] ?? []);

            return [
                'path'     => $filePath,
                'url'      => $this->generatePublicUrl($filePath),
                'filename' => basename($filePath),
                'size'     => is_file($filePath) ? filesize($filePath) : 0,
                'type'     => $viewData['isFinal'] ? 'final' : 'preview',
            ];
        } catch (\Throwable $e) {
            Log::error('ReceiptPdfMasterService::generatePdf error: ' . $e->getMessage(), [
                'invoice_id'     => $invoice->id ?? null,
                'invoice_number' => $invoice->number ?? 'N/A',
                'trace'          => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Stream PDF แสดงบนเบราว์เซอร์ทันที
     * @param Invoice $invoice
     * @param array<string,mixed> $options
     * @return \Illuminate\Http\Response
     */
    public function streamPdf(Invoice $invoice, array $options = []): \Illuminate\Http\Response
    {
        $viewData = $this->buildViewData($invoice, $options);

        $mpdf = $this->createMpdf($viewData);

        $filename = sprintf('receipt-%s.pdf', $viewData['invoice']->number ?? $viewData['invoice']->id);

        return response($mpdf->Output('', 'S'))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="' . $filename . '"');
    }

    /**
     * สร้าง mPDF instance + โหลด CSS + ตั้ง Header/Footer + เขียน Body
     * @param array<string,mixed> $viewData
     */
    protected function createMpdf(array $viewData): Mpdf
    {
        $options = $viewData['options'] ?? [];

        // ฟอนต์ไทย
        $defaultConfig     = (new ConfigVariables())->getDefaults();
        $fontDirs          = $defaultConfig['fontDir'];
        $defaultFontConfig = (new FontVariables())->getDefaults();
        $fontData          = $defaultFontConfig['fontdata'];

        $customFontDir  = config('pdf.custom_font_dir', public_path('fonts/thsarabun/'));
        $customFontData = config('pdf.custom_font_data', [
            'thsarabun' => [
                'R'  => 'Sarabun-Regular.ttf',
                'B'  => 'Sarabun-Bold.ttf',
                'I'  => 'Sarabun-Italic.ttf',
                'BI' => 'Sarabun-BoldItalic.ttf',
            ],
        ]);
        $hasThaiFonts = $this->checkThaiFonts();

        $config = [
            'mode'                => 'utf-8',
            'format'              => $options['format']      ?? 'A4',
            'orientation'         => $options['orientation'] ?? 'P',
            'margin_left'         => 10,
            'margin_right'        => 10,
            'margin_top'          => 16,
            'margin_bottom'       => 14,
            'setAutoTopMargin'    => 'stretch',
            'setAutoBottomMargin' => 'stretch',

            'default_font'        => $hasThaiFonts ? 'thsarabun' : 'dejavusans',
            'default_font_size'   => 12,
            'fontDir'             => $hasThaiFonts ? array_merge($fontDirs, [$customFontDir]) : $fontDirs,
            'fontdata'            => $hasThaiFonts ? ($fontData + $customFontData) : $fontData,

            'tempDir'             => storage_path('app/mpdf-temp'),
            'curlAllowUnsafeSslRequests' => true,
            'useOTL'              => 0xFF,
            'useKerning'          => true,
            'autoLangToFont'      => true,
            'autoScriptToLang'    => true,
        ];

        if (!is_dir($config['tempDir'])) {
            @mkdir($config['tempDir'], 0755, true);
        }

        $mpdf = new Mpdf($config);
        $mpdf->curlTimeout = 5;
        $mpdf->curlExecutionTimeout = 5;
        $mpdf->curlFollowLocation = true;
        $mpdf->curlAllowUnsafeSslRequests = true;
        $mpdf->img_dpi = 96;
        $mpdf->interpolateImages = true;
        if (property_exists($mpdf, 'jpeg_quality')) {
            $mpdf->jpeg_quality = 90;
        }

        // CSS
        $this->writeCss($mpdf, $this->cssFiles());

        // Header/Footer
        $this->addHeaderFooter($mpdf, $viewData);

        // Body: ใช้ template เดิมจาก invoice
        $depositMode = $options['deposit_mode'] ?? 'before';
        $templateName = ($depositMode === 'after')
            ? 'accounting.pdf.invoice.invoice-deposit-after'
            : 'accounting.pdf.invoice.invoice-master';

        $html = View::make($templateName, $viewData)->render();
        $mpdf->WriteHTML($html, HTMLParserMode::HTML_BODY);

        // Signature (reuse invoice partial)
        $this->renderSignatureAdaptive($mpdf, $viewData);

        return $mpdf;
    }

    /**
     * ระบุรายการไฟล์ CSS ที่ต้องโหลด (reuse invoice styles)
     * @return array<int,string>
     */
    protected function cssFiles(): array
    {
        return [
            resource_path('views/accounting/pdf/shared/pdf-shared-base.css'),
            resource_path('views/accounting/pdf/invoice/invoice-master.css'),
            resource_path('views/pdf/partials/invoice-header.css'),
        ];
    }

    /**
     * เพิ่ม header และ footer ให้แสดงทุกหน้า (เปลี่ยนเฉพาะ header)
     * @param array<string,mixed> $data
     */
    protected function addHeaderFooter(Mpdf $mpdf, array $data): void
    {
        $invoice  = $data['invoice'];
        $customer = $data['customer'];
        $isFinal  = $data['isFinal'];
        $summary  = $data['summary'] ?? [];

        // ดึงโลโก้แบบ absolute path ที่ mPDF อ่านได้
        $companyId = $invoice->company_id ?? $invoice->customer?->company_id ?? null;
        $logoInfo = app(\App\Services\CompanyLogoService::class)->getLogoInfo($companyId);
        $logoPath = $logoInfo['path'] ?? public_path('images/logo.png');

        // Header เฉพาะ Receipt
        $headerHtml = View::make('accounting.pdf.receipt.partials.receipt-header', compact(
            'invoice', 'customer', 'isFinal', 'summary', 'logoPath'
        ))->render();

        // Footer ใช้ของ invoice เดิม
        $footerHtml = View::make('accounting.pdf.invoice.partials.invoice-footer', compact(
            'invoice', 'customer', 'isFinal'
        ))->render();

        $mpdf->SetHTMLHeader($headerHtml);
        $mpdf->SetHTMLFooter($footerHtml);

        // แสดง PREVIEW watermark เมื่อเป็นโหมด preview หรือเมื่อทั้ง before/after เป็น draft หรือฝั่งที่กำลังดูเป็น draft
        $bothDraft = (strtolower($invoice->status_before ?? '') === 'draft')
            && (strtolower($invoice->status_after ?? '') === 'draft');
        $mode = strtolower($data['options']['deposit_mode'] ?? ($invoice->deposit_display_order ?? 'before'));
        $activeSideStatus = $mode === 'after'
            ? strtolower($invoice->status_after ?? '')
            : strtolower($invoice->status_before ?? '');
        $activeDraft = ($activeSideStatus === 'draft');
        $shouldWatermark = (!$isFinal && ($data['options']['showWatermark'] ?? true)) || $bothDraft || $activeDraft;
        if ($shouldWatermark) {
            $mpdf->SetWatermarkText('PREVIEW', 0.1);
            $mpdf->showWatermarkText = true;
        }
    }

    /**
     * บันทึกไฟล์ PDF สำหรับ Receipt
     * @param array<string,mixed> $options
     */
    protected function savePdfFile(Mpdf $mpdf, Invoice $invoice, array $options = []): string
    {
        $timestamp = now()->format('Y-m-d-His');
        $headerType = $options['document_header_type'] ?? $invoice->document_header_type ?? 'ต้นฉบับ';
        $headerSlug = $this->slugHeaderType($headerType);
        $filename = sprintf('receipt-%s-%s-%s.pdf',
            $invoice->number ?? $invoice->id,
            $headerSlug,
            $timestamp
        );

        $directory = storage_path('app/public/pdfs/receipts');
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filePath = $directory . DIRECTORY_SEPARATOR . $filename;
        $mpdf->Output($filePath, 'F');

        return $filePath;
    }
}
