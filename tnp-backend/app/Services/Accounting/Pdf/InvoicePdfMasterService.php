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
     *     /**
     * สร้าง key สำหรับจัดกลุ่มรายการสินค้า
     * @param array<string, mixed> $itemData
     */
    protected function generateItemGroupKey(array $itemData): string
    {
        $keyParts = [
            $itemData['item_name'] ?? '',
            $itemData['pattern'] ?? '',
            $itemData['fabric_type'] ?? '',
            $itemData['color'] ?? ''
        ];
        
        return md5(implode('|', $keyParts));
    }
    
    /**
     * @param Invoice $invoice
     * @param array<string, mixed> $options ['format'=>'A4','orientation'=>'P','showPageNumbers'=>true,'showWatermark'=>bool]
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
     * @param array<string, mixed> $options
     */
    public function streamPdf(Invoice $invoice, array $options = []): \Symfony\Component\HttpFoundation\Response
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
     * @param array<string, mixed> $options
     * @return array<string, mixed>
     */
    protected function buildViewData(Invoice $invoice, array $options = []): array
    {
        $i = $invoice->loadMissing(['company', 'customer', 'quotation', 'quotation.items', 'items', 'creator', 'manager', 'referenceInvoice']);

        // Allow runtime override of document header type (ไม่บันทึกลง DB)
        if (!empty($options['document_header_type'])) {
            $i->document_header_type = $options['document_header_type'];
        }

        $customer = CustomerInfoExtractor::fromInvoice($i);
        $items    = $this->getInvoiceItems($i);
        $summary  = $this->buildFinancialSummary($i);
        
        // สร้างข้อมูล groups สำหรับ deposit-after mode
        $groups = $this->groupInvoiceItems($i);

        $isFinal  = in_array($i->status, ['approved', 'sent', 'completed', 'partial_paid', 'fully_paid'], true);

        return [
            'invoice'   => $i,
            'customer'  => $customer,
            'items'     => $items,
            'groups'    => $groups,
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
     * @param array<string, mixed> $viewData
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
        // Select template based on deposit mode
        $depositMode = $options['deposit_mode'] ?? 'before';
        $templateName = ($depositMode === 'after') 
            ? 'accounting.pdf.invoice.invoice-deposit-after' 
            : 'accounting.pdf.invoice.invoice-master';
        
        $html = View::make($templateName, $viewData)->render();
        $mpdf->WriteHTML($html, HTMLParserMode::HTML_BODY);

        /* 4) เพิ่มลายเซ็นแบบ fixed ที่ท้ายหน้าสุดท้าย (ต้องมา AFTER body) */
        $this->renderSignatureAdaptive($mpdf, $viewData);

        return $mpdf;
    }

    /**
     * ระบุรายการไฟล์ CSS ที่ต้องโหลด
     * @return array<string>
     */
    protected function cssFiles(): array
    {
        return [
            // Shared base styles (keep first)
            resource_path('views/accounting/pdf/shared/pdf-shared-base.css'),
            resource_path('views/accounting/pdf/invoice/invoice-master.css'),
            resource_path('views/pdf/partials/invoice-header.css'),
        ];
    }

    /**
     * โหลด CSS เข้าสู่ mPDF (HEADER_CSS)
     * @param array<string> $files
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
     * @param array<string, mixed> $data
     */
    protected function addHeaderFooter(Mpdf $mpdf, array $data): void
    {
        $invoice  = $data['invoice'];
        $customer = $data['customer'];
        $isFinal  = $data['isFinal'];

        // Header
        $summary = $data['summary'] ?? [];
        $headerHtml = View::make('accounting.pdf.invoice.partials.invoice-header', compact(
            'invoice', 'customer', 'isFinal', 'summary'
        ))->render();

        // Footer
        $footerHtml = View::make('accounting.pdf.invoice.partials.invoice-footer', compact(
            'invoice', 'customer', 'isFinal'
        ))->render();

        $mpdf->SetHTMLHeader($headerHtml);
        $mpdf->SetHTMLFooter($footerHtml);

        // Watermark เฉพาะ preview หรือบังคับเมื่อทั้ง before/after เป็น draft หรือเมื่อฝั่งที่กำลังดูเป็น draft
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
     * วาดกล่องลายเซ็นแบบ Adaptive (เลียนแบบจาก QuotationPdfMasterService)
     * 1) ถ้าหน้าปัจจุบันมีพื้นที่เพียงพอ -> วางทันที
     * 2) ถ้าเหลือ >= requiredHeight -> แทรก signature ทันทีพร้อมดันลงด้วย margin-top
     * 3) ถ้าเหลือ < requiredHeight -> เพิ่มหน้าใหม่ แล้ววาง signature ล่างหน้าใหม่
     * 4) มีระบบ fallback หากการวางแบบ adaptive ล้มเหลว
     * @param array<string, mixed> $data
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
     * @return array<string, mixed>
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
     * @return array<string, mixed>
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
     * @param array<string, mixed> $options
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
     * @return array<mixed>
     */
    protected function getInvoiceItems(Invoice $invoice): array
    {
        // หาก Invoice มี items ของตัวเอง ให้ใช้ของ Invoice (จาก invoice_items table)
        if ($invoice->items->count() > 0) {
            return $invoice->items->sortBy('sequence_order')->values()->toArray();
        }

        // หากไม่มี ให้ดึงจาก Quotation (สำหรับใบแจ้งหนี้เก่าที่ไม่มี invoice_items)
        if ($invoice->quotation?->items) {
            return $invoice->quotation->items->toArray();
        }

        return [];
    }

    /**
     * จัดกลุ่มรายการสินค้าจาก invoice_items สำหรับแสดงในตารางแบบ quotation
     * @return array<mixed>
     */
    protected function groupInvoiceItems(Invoice $invoice): array
    {
        $items = $this->getInvoiceItems($invoice);
        
        if (empty($items)) {
            return [];
        }

        $groups = [];
        
        foreach ($items as $item) {
            // แปลงข้อมูลจาก invoice_items หรือ quotation_items
            $itemData = $this->normalizeItemData($item);
            
            // สร้าง key สำหรับจัดกลุ่มโดยใช้ item_name + pattern + fabric_type + color
            $groupKey = $this->generateItemGroupKey($itemData);
            
            if (!isset($groups[$groupKey])) {
                $groups[$groupKey] = [
                    'name' => $itemData['item_name'],
                    'pattern' => $itemData['pattern'],
                    'fabric' => $itemData['fabric_type'],
                    'color' => $itemData['color'],
                    'unit' => $itemData['unit'],
                    'rows' => []
                ];
            }
            
            // เพิ่มรายการลงในกลุ่ม
            $groups[$groupKey]['rows'][] = [
                'size' => $itemData['size'],
                'quantity' => $itemData['quantity'],
                'unit_price' => $itemData['unit_price'],
                'discount_amount' => $itemData['discount_amount'],
                'item_description' => $itemData['item_description'],
            ];
        }

        return array_values($groups);
    }

    /**
     * แปลงข้อมูล item ให้เป็นรูปแบบเดียวกัน
     * @return array<string, mixed>
     */
    protected function normalizeItemData(mixed $item): array
    {
        // ตรวจสอบว่าเป็นข้อมูลจาก invoice_items หรือ quotation_items
        $isInvoiceItem = isset($item['item_name']);
        
        return [
            'item_name' => $isInvoiceItem 
                ? ($item['item_name'] ?? 'ไม่ระบุชื่องาน')
                : ($item['name'] ?? 'ไม่ระบุชื่องาน'),
            'pattern' => $item['pattern'] ?? null,
            'fabric_type' => $isInvoiceItem 
                ? ($item['fabric_type'] ?? null)
                : ($item['fabric'] ?? null),
            'color' => $item['color'] ?? null,
            'unit' => $item['unit'] ?? 'ชิ้น',
            'size' => $item['size'] ?? '-',
            'quantity' => (float)($item['quantity'] ?? 0),
            'unit_price' => (float)($item['unit_price'] ?? 0),
            'discount_amount' => (float)($item['discount_amount'] ?? 0),
            'item_description' => $isInvoiceItem
                ? ($item['item_description'] ?? null)
                : ($item['description'] ?? null),
        ];
    }



    /**
     * สร้างสรุปทางการเงิน
     * @return array<string, mixed>
     */
    protected function buildFinancialSummary(Invoice $invoice): array
    {
        // Basic financial data
        $subtotal = (float) ($invoice->subtotal ?? 0);
        $specialDiscountAmount = (float) ($invoice->special_discount_amount ?? 0);
        $hasVat = (bool) ($invoice->has_vat ?? true);
        $vatPercentage = (float) ($invoice->vat_percentage ?? 7.00);
        $hasWithholdingTax = (bool) ($invoice->has_withholding_tax ?? false);
        $withholdingTaxPercentage = (float) ($invoice->withholding_tax_percentage ?? 0);
        $withholdingTaxAmount = (float) ($invoice->withholding_tax_amount ?? 0);

        // Calculate deposit-after specific amounts
        $depositAfterCalculations = $this->calculateDepositAfterAmounts($invoice);

        return [
            'subtotal' => $subtotal,
            'special_discount_percentage' => $invoice->special_discount_percentage ?? 0,
            'special_discount_amount' => $specialDiscountAmount,
            'has_vat' => $hasVat,
            'vat_percentage' => $vatPercentage,
            'vat_amount' => $invoice->vat_amount ?? 0,
            'has_withholding_tax' => $hasWithholdingTax,
            'withholding_tax_percentage' => $withholdingTaxPercentage,
            'withholding_tax_amount' => $withholdingTaxAmount,
            'total_amount' => $invoice->total_amount ?? 0,
            'final_total_amount' => $invoice->final_total_amount ?? $invoice->total_amount ?? 0,
            
            // New deposit-after calculations
            'deposit_after' => $depositAfterCalculations,
        ];
    }

    /**
     * คำนวณยอดเงินสำหรับใบวางบิลหลังมัดจำ
     * @return array<string, mixed>
     */
    protected function calculateDepositAfterAmounts(Invoice $invoice): array
    {
        // ตรวจสอบว่าเป็นใบวางบิลหลังมัดจำหรือไม่
        // ใบวางบิลหลังมัดจำคือ:
        // 1. type = 'remaining' (ใบวางบิลคงเหลือ)
        // 2. deposit_display_order = 'after' (แสดงยอดหลังหักมัดจำ)
        $isDepositAfter = (
            ($invoice->type ?? '') === 'remaining' || 
            ($invoice->deposit_display_order ?? '') === 'after'
        );
        
        if (!$isDepositAfter) {
            return [
                'is_deposit_after' => false,
                'total_before_vat' => 0,
                'deposit_paid_before_vat' => 0,
                'amount_after_deposit_deduction' => 0,
                'vat_on_remaining' => 0,
                'final_total_with_vat' => 0,
                'reference_invoice_number' => '',
            ];
        }

        // 1. รวมเป็นเงิน = เงินทั้งหมด (ก่อนคำนวน vat7%)
        $totalBeforeVat = 0;
        
        // Use subtotal_before_vat if available, otherwise fallback to existing logic
        if (!empty($invoice->subtotal_before_vat)) {
            $totalBeforeVat = (float) $invoice->subtotal_before_vat;
        } elseif ($invoice->quotation) {
            // ใช้ยอดจากใบเสนอราคา (subtotal ก่อน VAT)
            $totalBeforeVat = (float) ($invoice->quotation->subtotal ?? 0);
        } else {
            // fallback ใช้ยอดจาก invoice เอง
            $totalBeforeVat = (float) ($invoice->subtotal ?? 0);
        }

        // 2. หักเงินมัดจำ(รหัสใบวางบิล ก่อน) = เงินทั้งหมดที่จ่ายในมัดจำก่อน (ก่อนคำนวน vat7%)
        $depositPaidBeforeVat = 0;
        $referenceInvoiceNumber = '';
        
        // กรณีพิเศษ: ถ้าเป็น deposit แต่แสดงผลแบบ after (ใบมัดจำเดียวที่แสดงยอดคงเหลือ)
        if (($invoice->type ?? '') === 'deposit' && ($invoice->deposit_display_order ?? '') === 'after') {
            // ใช้ deposit_amount_before_vat ของตัวเองเป็นยอดที่หัก
            $depositPaidBeforeVat = (float) ($invoice->deposit_amount_before_vat ?? 0);
            $referenceInvoiceNumber = $invoice->number_before ?: ($invoice->number ?? '');
        }
        // First, try to use reference_invoice_id if available
        elseif ($invoice->reference_invoice_id && $invoice->referenceInvoice) {
            $depositInvoice = $invoice->referenceInvoice;
            // Use deposit_amount_before_vat if available, otherwise subtotal_before_vat, then subtotal
            if (!empty($depositInvoice->deposit_amount_before_vat)) {
                $depositPaidBeforeVat = (float) $depositInvoice->deposit_amount_before_vat;
            } elseif (!empty($depositInvoice->subtotal_before_vat)) {
                $depositPaidBeforeVat = (float) $depositInvoice->subtotal_before_vat;
            } else {
                $depositPaidBeforeVat = (float) ($depositInvoice->subtotal ?? 0);
            }
            $referenceInvoiceNumber = $invoice->reference_invoice_number ?: ($depositInvoice->number_before ?: $depositInvoice->number);
        } else {
            // Fallback: หาใบแจ้งหนี้มัดจำก่อนหน้า
            $depositInvoice = null;
            
            if ($invoice->quotation_id) {
                // หาใบมัดจำที่อ้างอิงใบเสนอราคาเดียวกัน
                $depositInvoice = \App\Models\Accounting\Invoice::where('quotation_id', $invoice->quotation_id)
                    ->where('type', 'deposit')
                    ->where('status_before', 'approved')
                    ->where('id', '!=', $invoice->id)
                    ->orderBy('created_at', 'asc') // เอาใบแรกสุด
                    ->first();
            }
            
            // ถ้ายังไม่เจอ ลองหาจาก customer เดียวกันและวันที่ใกล้เคียง
            if (!$depositInvoice && $invoice->customer_id) {
                $depositInvoice = \App\Models\Accounting\Invoice::where('customer_id', $invoice->customer_id)
                    ->where('type', 'deposit')
                    ->where('status_before', 'approved')
                    ->where('id', '!=', $invoice->id)
                    ->where('created_at', '<=', $invoice->created_at)
                    ->orderBy('created_at', 'desc') // เอาใบล่าสุด
                    ->first();
            }
                    
            if ($depositInvoice) {
                // Use deposit_amount_before_vat if available, otherwise subtotal_before_vat, then subtotal
                if (!empty($depositInvoice->deposit_amount_before_vat)) {
                    $depositPaidBeforeVat = (float) $depositInvoice->deposit_amount_before_vat;
                } elseif (!empty($depositInvoice->subtotal_before_vat)) {
                    $depositPaidBeforeVat = (float) $depositInvoice->subtotal_before_vat;
                } else {
                    $depositPaidBeforeVat = (float) ($depositInvoice->subtotal ?? 0);
                }
                $referenceInvoiceNumber = $depositInvoice->number_before ?: ($depositInvoice->number ?? '');
            }
        }

        // 3. จำนวนเงินหลังหักมัดจำ = เงินทั้งหมด (ก่อนคำนวน vat7%) - เงินทั้งหมดที่จ่ายในมัดจำก่อน (ก่อนคำนวน vat7%)
        $amountAfterDepositDeduction = max(0, $totalBeforeVat - $depositPaidBeforeVat);

        // 4. ภาษีมูลค่าเพิ่ม 7% = จำนวนเงินหลังหักมัดจำ * 7%
        $vatPercentage = (float) ($invoice->vat_percentage ?? 7.00);
        $vatOnRemaining = ($invoice->has_vat ?? true) ? round($amountAfterDepositDeduction * ($vatPercentage / 100), 2) : 0;

        // 5. จำนวนเงินรวมทั้งสิ้น = จำนวนเงินหลังหักมัดจำ * 7% + จำนวนเงินหลังหักมัดจำ
        $finalTotalWithVat = $amountAfterDepositDeduction + $vatOnRemaining;

        return [
            'is_deposit_after' => true,
            'total_before_vat' => $totalBeforeVat,
            'deposit_paid_before_vat' => $depositPaidBeforeVat,
            'amount_after_deposit_deduction' => $amountAfterDepositDeduction,
            'vat_on_remaining' => $vatOnRemaining,
            'final_total_with_vat' => $finalTotalWithVat,
            'reference_invoice_number' => $referenceInvoiceNumber,
            
            // Alternative variable names for template convenience
            'subtotal_before_vat' => $totalBeforeVat,
            'deposit_before_vat' => $depositPaidBeforeVat,
            'net_after_deposit_before_vat' => $amountAfterDepositDeduction,
            'vat_rate' => $vatPercentage,
            'vat_amount' => $vatOnRemaining,
            'grand_total' => $finalTotalWithVat,
            'ref_before_number' => $referenceInvoiceNumber,
        ];
    }

    /**
     * ตรวจสอบสถานะระบบ
     * @return array<string, mixed>
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
