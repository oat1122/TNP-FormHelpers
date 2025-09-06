<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\Invoice;
use App\Services\Accounting\Pdf\CustomerInfoExtractor;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\HTMLParserMode;
use Mpdf\Mpdf;

/**
 * Master PDF Service สำหรับใบแจ้งหนี้/วางบิล
 * - รวมการตั้งค่าที่จำเป็นของ mPDF
 * - โหลด CSS กลางให้ก่อน แล้วค่อย Set Header/Footer + Body
 * - มีทั้ง generate เป็นไฟล์ และ stream แสดงทันที
 */
class InvoicePdfMasterService
{
    /**
     * สร้าง PDF ใบแจ้งหนี้เป็นไฟล์ พร้อม URL
     *
     * @param  Invoice $invoice
     * @param  array $options ['format'=>'A4','orientation'=>'P','showPageNumbers'=>true,'showWatermark'=>bool]
     * @return array{path:string,url:string,filename:string,size:int,type:string}
     */
    public function generatePdf(Invoice $invoice, array $options = []): array
    {
        try {
            $viewData = $this->buildViewData($invoice, $options);

            // 1) สร้าง mPDF + โหลด CSS + Set Header/Footer + Body
            $mpdf = $this->createMpdf($viewData);

            // 2) บันทึกลงไฟล์
            $filePath = $this->savePdfFile($mpdf, $viewData['invoice']);

            return [
                'path'     => $filePath,
                'url'      => $this->generatePublicUrl($filePath),
                'filename' => basename($filePath),
                'size'     => is_file($filePath) ? filesize($filePath) : 0,
                'type'     => $viewData['isFinal'] ? 'final' : 'preview',
            ];
        } catch (\Throwable $e) {
            Log::error('InvoicePdfMasterService::generatePdf error: '.$e->getMessage(), [
                'invoice_id'     => $invoice->id ?? null,
                'invoice_number' => $invoice->number ?? 'N/A',
                'trace'          => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Stream PDF แสดงบนเบราว์เซอร์ทันที
     */
    public function streamPdf(Invoice $invoice, array $options = [])
    {
        $viewData = $this->buildViewData($invoice, $options);

        $mpdf = $this->createMpdf($viewData);

        $filename = sprintf('invoice-%s.pdf', $viewData['invoice']->number ?? $viewData['invoice']->id);

        // ส่งเนื้อหา PDF ออกแบบ inline
        return response($mpdf->Output('', 'S'))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="'.$filename.'"');
    }

    /* =======================================================================
     |  Core builders
     * ======================================================================= */

    /**
     * เตรียมข้อมูลสำหรับ View/Template
     */
    protected function buildViewData(Invoice $invoice, array $options = []): array
    {
        $i = $invoice->loadMissing(['company', 'customer', 'quotation', 'quotation.items']);

        $customer = CustomerInfoExtractor::fromInvoice($i);
        $items    = $this->getInvoiceItems($i);
        $summary  = $this->buildFinancialSummary($i);

        $isFinal  = in_array($i->status, ['approved', 'sent', 'completed', 'partial_paid', 'fully_paid'], true);

        return [
            'invoice'   => $i,
            'customer'  => $customer,
            'items'     => $items,
            'summary'   => $summary,
            'isFinal'   => $isFinal,
            'options'   => array_merge([
                'format'          => 'A4',
                'orientation'     => 'P',
                'showPageNumbers' => true,
                'showWatermark'   => !$isFinal,
            ], $options),
        ];
    }

    /**
     * สร้าง mPDF instance + โหลด CSS + ตั้ง Header/Footer + เขียน Body
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
            // ระยะขอบ (mm)
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
            // Avoid SSL verification issues when fetching any remote assets (dev envs)
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
        // Conservative cURL settings (supported by mPDF)
        $mpdf->curlTimeout = 5;             // connection timeout seconds
        $mpdf->curlExecutionTimeout = 5;    // total execution timeout seconds
        $mpdf->curlFollowLocation = true;   // allow redirects when fetching remote assets
        $mpdf->curlAllowUnsafeSslRequests = true; // dev-friendly HTTPS
        // Reasonable image DPI and interpolation for better perceived sharpness when downscaling
        $mpdf->img_dpi = 96;
        $mpdf->interpolateImages = true;
        // Prefer higher JPEG quality when mPDF needs to re-encode
        if (property_exists($mpdf, 'jpeg_quality')) {
            $mpdf->jpeg_quality = 90; // default is ~75
        }

        /* 1) โหลด CSS (สำคัญ: ให้มาก่อน Header/Footer/Body เสมอ) */
        $this->writeCss($mpdf, $this->cssFiles());

        /* 2) ตั้งค่า Header/Footer + Watermark */
        $this->addHeaderFooter($mpdf, $viewData);

        /* 3) เขียน HTML ของเนื้อหา */
        $html = View::make('accounting.pdf.invoice.invoice-master', $viewData)->render();
        $mpdf->WriteHTML($html, HTMLParserMode::HTML_BODY);

        /* 4) เพิ่มลายเซ็นแบบ fixed ที่ท้ายหน้าสุดท้าย (ต้องมา AFTER body) */
        $this->renderSignatureAdaptive($mpdf, $viewData);

        return $mpdf;
    }

    /**
     * ระบุรายการไฟล์ CSS ที่ต้องโหลด
     */
    protected function cssFiles(): array
    {
        return [
            resource_path('views\accounting\pdf\invoice\invoice-master.css'),
            resource_path('views\pdf\partials\invoice-header.css'),
        ];
    }

    /**
     * โหลด CSS เข้าสู่ mPDF (HEADER_CSS)
     */
    protected function writeCss(Mpdf $mpdf, array $files): void
    {
        foreach ($files as $file) {
            if ($file && is_file($file)) {
                $mpdf->WriteHTML(file_get_contents($file), HTMLParserMode::HEADER_CSS);
            }
        }
    }

    /**
     * เพิ่ม header และ footer ให้แสดงทุกหน้า
     */
    protected function addHeaderFooter(Mpdf $mpdf, array $data): void
    {
        $invoice  = $data['invoice'];
        $customer = $data['customer'];
        $isFinal  = $data['isFinal'];

        // Header
        $headerHtml = View::make('accounting.pdf.invoice.partials.invoice-header', compact(
            'invoice', 'customer', 'isFinal'
        ))->render();

        // Footer
        $footerHtml = View::make('accounting.pdf.invoice.partials.invoice-footer', compact(
            'invoice', 'customer', 'isFinal'
        ))->render();

        $mpdf->SetHTMLHeader($headerHtml);
        $mpdf->SetHTMLFooter($footerHtml);

        // Watermark เฉพาะ preview
        if (!$isFinal && ($data['options']['showWatermark'] ?? true)) {
            $mpdf->SetWatermarkText('PREVIEW', 0.1);
            $mpdf->showWatermarkText = true;
        }
    }

    /**
     * วาดกล่องลายเซ็นคงที่ (fixed) บนหน้าสุดท้าย เหนือ footer
     */
    protected function renderSignatureAdaptive(Mpdf $mpdf, array $data): void
    {
        $invoice = $data['invoice'];
        
        // ตรวจสอบว่ามีลายเซ็นหรือไม่
        if (empty($invoice->signature_customer_image) && empty($invoice->signature_company_image)) {
            return;
        }

        $pageCount = $mpdf->page;
        $marginBottom = 14; // จาก config margin_bottom
        $footerHeight = 10; // ประมาณความสูงของ footer
        $signatureHeight = 25; // ความสูงของกล่องลายเซ็น

        // คำนวณตำแหน่ง Y ที่เหมาะสม
        $yPosition = 297 - $marginBottom - $footerHeight - $signatureHeight; // A4 height = 297mm

        // วาดลายเซ็นบนหน้าสุดท้าย
        $signatureHtml = View::make('accounting.pdf.invoice.partials.invoice-signature', compact('invoice'))->render();
        
        $mpdf->WriteFixedPosHTML($signatureHtml, 0, $yPosition, 210, $signatureHeight, 'auto');
    }

    /**
     * บันทึกไฟล์ PDF
     */
    protected function savePdfFile(Mpdf $mpdf, Invoice $invoice): string
    {
        $timestamp = now()->format('Y-m-d-His');
        $filename = sprintf('invoice-%s-%s.pdf', 
            $invoice->number ?? $invoice->id, 
            $timestamp
        );

        $directory = storage_path('app/public/pdfs/invoices');
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filePath = $directory . DIRECTORY_SEPARATOR . $filename;
        $mpdf->Output($filePath, 'F');

        return $filePath;
    }

    /**
     * สร้าง public URL
     */
    protected function generatePublicUrl(string $filePath): string
    {
        $relativePath = str_replace(
            storage_path('app/public/'),
            '',
            $filePath
        );
        return url('storage/' . str_replace('\\', '/', $relativePath));
    }

    /**
     * ตรวจสอบฟอนต์ไทย
     */
    protected function checkThaiFonts(): bool
    {
        $fontDir = config('pdf.custom_font_dir', public_path('fonts/thsarabun/'));
        $requiredFonts = [
            'Sarabun-Regular.ttf',
            'Sarabun-Bold.ttf'
        ];

        foreach ($requiredFonts as $font) {
            if (!file_exists($fontDir . $font)) {
                return false;
            }
        }

        return true;
    }

    /**
     * ดึงรายการสินค้า/บริการจาก Invoice
     */
    protected function getInvoiceItems(Invoice $invoice): array
    {
        // หาก Invoice มี items ของตัวเอง ให้ใช้ของ Invoice
        if ($invoice->items && $invoice->items->count() > 0) {
            return $invoice->items->toArray();
        }

        // หากไม่มี ให้ดึงจาก Quotation
        if ($invoice->quotation && $invoice->quotation->items) {
            return $invoice->quotation->items->toArray();
        }

        return [];
    }

    /**
     * สร้างสรุปทางการเงิน
     */
    protected function buildFinancialSummary(Invoice $invoice): array
    {
        return [
            'subtotal' => $invoice->subtotal ?? 0,
            'special_discount_percentage' => $invoice->special_discount_percentage ?? 0,
            'special_discount_amount' => $invoice->special_discount_amount ?? 0,
            'has_vat' => $invoice->has_vat ?? true,
            'vat_percentage' => $invoice->vat_percentage ?? 7,
            'vat_amount' => $invoice->vat_amount ?? 0,
            'has_withholding_tax' => $invoice->has_withholding_tax ?? false,
            'withholding_tax_percentage' => $invoice->withholding_tax_percentage ?? 0,
            'withholding_tax_amount' => $invoice->withholding_tax_amount ?? 0,
            'total_amount' => $invoice->total_amount ?? 0,
            'final_total_amount' => $invoice->final_total_amount ?? $invoice->total_amount ?? 0,
        ];
    }

    /**
     * ตรวจสอบสถานะระบบ
     */
    public function checkSystemStatus(): array
    {
        $status = [];

        // ตรวจสอบ mPDF
        try {
            $mpdf = new Mpdf(['tempDir' => storage_path('app/mpdf-temp')]);
            $status['mpdf'] = true;
        } catch (\Exception $e) {
            $status['mpdf'] = false;
            $status['mpdf_error'] = $e->getMessage();
        }

        // ตรวจสอบฟอนต์
        $status['thai_fonts'] = $this->checkThaiFonts();

        // ตรวจสอบ directories
        $status['temp_dir'] = is_writable(storage_path('app/mpdf-temp'));
        $status['output_dir'] = is_writable(storage_path('app/public/pdfs/invoices'));

        $status['all_ready'] = $status['mpdf'] && $status['thai_fonts'] && 
                               $status['temp_dir'] && $status['output_dir'];

        return $status;
    }
}
