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
            $filePath = $this->savePdfFile($mpdf, $viewData['invoice'], $viewData['options'] ?? []);

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
        $i = $invoice->loadMissing(['company', 'customer', 'quotation', 'quotation.items', 'creator', 'manager']);

        // Allow runtime override of document header type (ไม่บันทึกลง DB)
        if (!empty($options['document_header_type'])) {
            $i->document_header_type = $options['document_header_type'];
        }

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
            // Shared base styles (keep first)
            resource_path('views\\accounting\\pdf\\shared\\pdf-shared-base.css'),
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
     * วาดกล่องลายเซ็นแบบ Adaptive (เลียนแบบจาก QuotationPdfMasterService)
     * 1) ถ้าหน้าปัจจุบันมีพื้นที่เพียงพอ -> วางทันที
     * 2) ถ้าเหลือ >= requiredHeight -> แทรก signature ทันทีพร้อมดันลงด้วย margin-top
     * 3) ถ้าเหลือ < requiredHeight -> เพิ่มหน้าใหม่ แล้ววาง signature ล่างหน้าใหม่
     * 4) มีระบบ fallback หากการวางแบบ adaptive ล้มเหลว
     */
    protected function renderSignatureAdaptive(Mpdf $mpdf, array $data): void
    {
        try {
            // Calculate signature dimensions dynamically
            $signatureDimensions = $this->calculateSignatureDimensions($mpdf);
            $requiredHeight = $signatureDimensions['height'];
            $bottomPadding = $signatureDimensions['padding'];
            
            // Get accurate page measurements
            $pageInfo = $this->getAccuratePageInfo($mpdf);
            $remaining = $pageInfo['remaining'];
            
            Log::info('Invoice Signature placement analysis', [
                'required_height' => $requiredHeight,
                'remaining_space' => $remaining,
                'current_page' => $mpdf->page,
                'current_y' => $mpdf->y
            ]);

            $sigHtml = View::make('accounting.pdf.invoice.partials.invoice-signature')->render();
            $signaturePlaced = false;

            // Strategy 1: Try to place on current page
            if ($remaining >= ($requiredHeight + $bottomPadding)) {
                $signaturePlaced = $this->placeSignatureOnCurrentPage($mpdf, $sigHtml, $remaining, $requiredHeight, $bottomPadding);
            }

            // Strategy 2: Create new page if current page doesn't have enough space
            if (!$signaturePlaced) {
                $signaturePlaced = $this->placeSignatureOnNewPage($mpdf, $sigHtml, $requiredHeight, $bottomPadding);
            }

            // Fallback Strategy 3: Emergency placement
            if (!$signaturePlaced) {
                $this->emergencySignaturePlacement($mpdf, $sigHtml);
            }

        } catch (\Throwable $e) {
            Log::error('Invoice Signature adaptive render failed: '.$e->getMessage(), [
                'invoice_id' => $data['invoice']->id ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);
            
            // Emergency fallback
            $this->emergencySignaturePlacement($mpdf, View::make('accounting.pdf.invoice.partials.invoice-signature')->render());
        }
    }

    /**
     * คำนวณขนาดที่ต้องการสำหรับลายเซ็นแบบ dynamic
     */
    protected function calculateSignatureDimensions(Mpdf $mpdf): array
    {
        // Base signature height calculation - made more compact
        $lineHeight = 4; // mm per line (reduced from 4.5)
        $headerHeight = 6; // mm for signature headers (reduced from 8)
        $paddingHeight = 8; // mm for internal padding and spacing (reduced from 12)
        $signatureBoxHeight = 12; // mm for actual signature area (reduced from 15)
        
        // Calculate total height needed
        $totalHeight = $headerHeight + $signatureBoxHeight + ($lineHeight * 3) + $paddingHeight;
        
        return [
            'height' => $totalHeight, // ~34mm total (was ~42mm)
            // Reduce bottom padding so signature sits closer to footer
            'padding' => 0, // was 8
        ];
    }

    /**
     * รับข้อมูลหน้าที่แม่นยำ
     */
    protected function getAccuratePageInfo(Mpdf $mpdf): array
    {
        $pageHeight = $mpdf->h; // ความสูงของหน้าใน mm
        $currentY = $mpdf->y;   // ตำแหน่ง Y ปัจจุบัน
        $bottomMargin = $mpdf->bMargin; // margin ด้านล่าง
        
        $usableBottom = $pageHeight - $bottomMargin;
        $remaining = $usableBottom - $currentY;
        
        return [
            'height' => $pageHeight,
            'current_y' => $currentY,
            'bottom_margin' => $bottomMargin,
            'usable_bottom' => $usableBottom,
            'remaining' => max(0, $remaining)
        ];
    }

    /**
     * วางลายเซ็นในหน้าปัจจุบัน
     */
    protected function placeSignatureOnCurrentPage(Mpdf $mpdf, string $sigHtml, float $remaining, float $requiredHeight, float $bottomPadding): bool
    {
        try {
            // Push signature down so it hugs the footer leaving only bottomPadding space
            // remaining = free space from current Y to bottom margin
            $pushDown = max($remaining - $requiredHeight - $bottomPadding, 0);

            // Guarantee a minimum spacing so it doesn't collide with previous content
            $minSpacing = 2; // mm (tighter than quotation's 3mm)
            $pushDown = max($pushDown, $minSpacing);

            $wrapper = sprintf(
                '<div style="margin-top:%.2fmm; page-break-inside:avoid;" class="invoice-signature-current-page">%s</div>',
                $pushDown,
                $sigHtml
            );

            $mpdf->WriteHTML($wrapper, HTMLParserMode::HTML_BODY);

            Log::info('Invoice Signature placed on current page (compressed layout)', [
                'page' => $mpdf->page,
                'remaining_space' => $remaining,
                'push_down' => $pushDown,
                'required_height' => $requiredHeight,
                'bottom_padding' => $bottomPadding
            ]);
            
            return true;
        } catch (\Throwable $e) {
            Log::warning('Failed to place invoice signature on current page: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * สร้างหน้าใหม่และวางลายเซ็นที่ด้านล่าง
     */
    protected function placeSignatureOnNewPage(Mpdf $mpdf, string $sigHtml, float $requiredHeight, float $bottomPadding): bool
    {
        try {
            $mpdf->AddPage();
            
            // On a fresh page we can place the signature near the bottom using a spacer div
            $pageInfo = $this->getAccuratePageInfo($mpdf);
            $available = $pageInfo['remaining']; // On new page this is almost full height

            // Space we want to consume above signature so that only bottomPadding remains under it
            $spacer = max($available - ($requiredHeight + $bottomPadding), 0);

            // Avoid excessive whitespace: cap spacer so that signature never floats mid-page
            $maxSpacer = 40; // mm (keep lower than half page)
            $spacer = min($spacer, $maxSpacer);

            $wrapper = sprintf(
                '<div style="height:%.2fmm;"></div><div class="invoice-signature-new-page" style="page-break-inside:avoid;">%s</div>',
                $spacer,
                $sigHtml
            );

            $mpdf->WriteHTML($wrapper, HTMLParserMode::HTML_BODY);

            Log::info('Invoice Signature placed on new page (compressed)', [
                'page' => $mpdf->page,
                'spacer' => $spacer,
                'available' => $available,
                'required_height' => $requiredHeight,
                'bottom_padding' => $bottomPadding
            ]);
            
            return true;
        } catch (\Throwable $e) {
            Log::warning('Failed to place invoice signature on new page: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * การวางลายเซ็นแบบฉุกเฉิน
     */
    protected function emergencySignaturePlacement(Mpdf $mpdf, string $sigHtml): void
    {
        try {
            // Simple fallback: just add signature at current position
            $mpdf->WriteHTML('<div style="margin-top: 10mm;"></div>');
            $mpdf->WriteHTML($sigHtml);
            
            Log::warning('Invoice Emergency signature placement used', [
                'page' => $mpdf->page,
                'y_position' => $mpdf->y
            ]);
        } catch (\Throwable $e) {
            Log::error('Invoice Emergency signature placement failed: ' . $e->getMessage());
        }
    }

    /**
     * บันทึกไฟล์ PDF
     */
    protected function savePdfFile(Mpdf $mpdf, Invoice $invoice, array $options = []): string
    {
        $timestamp = now()->format('Y-m-d-His');
        $headerType = $options['document_header_type'] ?? $invoice->document_header_type ?? 'ต้นฉบับ';
        $headerSlug = $this->slugHeaderType($headerType);
        $filename = sprintf('invoice-%s-%s-%s.pdf',
            $invoice->number ?? $invoice->id,
            $headerSlug,
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
     * สร้าง slug สำหรับใส่ในชื่อไฟล์ (อนุญาตตัวอักษรไทย/อังกฤษ/ตัวเลข แทนที่อย่างอื่นด้วย -)
     */
    protected function slugHeaderType(string $label): string
    {
        $label = trim($label);
        // จำกัดความยาวเพื่อกันชื่อไฟล์ยาวเกิน
        $label = mb_substr($label, 0, 30, 'UTF-8');
        // แทนช่องว่างด้วย -
        $label = preg_replace('/\s+/u', '-', $label);
        // กรองอักขระที่ไม่ใช่ ตัวอักษรไทย อังกฤษ ตัวเลข หรือ -
        $label = preg_replace('/[^ก-๙A-Za-z0-9\-]+/u', '', $label);
        return $label === '' ? 'doc' : mb_strtolower($label);
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
