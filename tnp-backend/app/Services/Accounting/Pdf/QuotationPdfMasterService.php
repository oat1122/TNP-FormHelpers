<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\Quotation;
use App\Services\Accounting\Pdf\CustomerInfoExtractor;
use App\Services\CompanyLogoService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\HTMLParserMode;
use Mpdf\Mpdf;

/**
 * Master PDF Service สำหรับใบเสนอราคา
 * - รวมการตั้งค่าที่จำเป็นของ mPDF
 * - โหลด CSS กลางให้ก่อน แล้วค่อย Set Header/Footer + Body
 * - มีทั้ง generate เป็นไฟล์ และ stream แสดงทันที
 */
class QuotationPdfMasterService
{
    /**
     * สร้าง PDF ใบเสนอราคาเป็นไฟล์ พร้อม URL
     *
     * @param  Quotation $quotation
     * @param  array $options ['format'=>'A4','orientation'=>'P','showPageNumbers'=>true,'showWatermark'=>bool]
     * @return array{path:string,url:string,filename:string,size:int,type:string}
     */
    public function generatePdf(Quotation $quotation, array $options = []): array
    {
        try {
            $viewData = $this->buildViewData($quotation, $options);

            // 1) สร้าง mPDF + โหลด CSS + Set Header/Footer + Body
            $mpdf = $this->createMpdf($viewData);

            // 2) บันทึกลงไฟล์
            $filePath = $this->savePdfFile($mpdf, $viewData['quotation']);

            return [
                'path'     => $filePath,
                'url'      => $this->generatePublicUrl($filePath),
                'filename' => basename($filePath),
                'size'     => is_file($filePath) ? filesize($filePath) : 0,
                'type'     => $viewData['isFinal'] ? 'final' : 'preview',
            ];
        } catch (\Throwable $e) {
            Log::error('QuotationPdfMasterService::generatePdf error: '.$e->getMessage(), [
                'quotation_id'     => $quotation->id ?? null,
                'quotation_number' => $quotation->number ?? 'N/A',
                'trace'            => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Stream PDF แสดงบนเบราว์เซอร์ทันที
     */
    public function streamPdf(Quotation $quotation, array $options = [])
    {
        $viewData = $this->buildViewData($quotation, $options);

        $mpdf = $this->createMpdf($viewData);

        $filename = sprintf('quotation-%s.pdf', $viewData['quotation']->number ?? $viewData['quotation']->id);

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
    protected function buildViewData(Quotation $quotation, array $options = []): array
    {
        $q = $quotation->loadMissing(['company', 'customer', 'items']);

        $customer = CustomerInfoExtractor::fromQuotation($q);
        $groups   = $this->groupQuotationItems($q);
        $summary  = $this->buildFinancialSummary($q);

        $isFinal  = in_array($q->status, ['approved', 'sent', 'completed'], true);

        return [
            'quotation' => $q,
            'customer'  => $customer,
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
        $html = View::make('accounting.pdf.quotation.quotation-master', $viewData)->render();
        $mpdf->WriteHTML($html, HTMLParserMode::HTML_BODY);

        /* 4) เพิ่มลายเซ็นแบบ fixed ที่ท้ายหน้าสุดท้าย (ต้องมา AFTER body) */
    $this->renderSignatureAdaptive($mpdf, $viewData);

        return $mpdf;
    }

    /**
     * ระบุรายการไฟล์ CSS ที่ต้องโหลด (แก้ path ตามโปรเจกต์จริง)
     * 
     *
     * ตัวอย่างไฟล์:
     * tnp-backend\resources\views\pdf\partials\quotation-header.css
     * tnp-backend\resources\views\accounting\pdf\quotation\quotation-master.css
     */
    protected function cssFiles(): array
    {
        return [
            // Shared base (typography + utilities) applied first
            resource_path('views/accounting/pdf/shared/pdf-shared-base.css'),
            resource_path('views/accounting/pdf/quotation/quotation-master.css'),
            resource_path('views/pdf/partials/quotation-header.css'),
            // resource_path('views/accounting/pdf/quotation/quotation-master.css'),
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
     * (หัว/ท้ายจะได้รับสไตล์จาก CSS ที่โหลดไว้แล้วด้านบน)
     */
    protected function addHeaderFooter(Mpdf $mpdf, array $data): void
    {
        $quotation = $data['quotation'];
        $customer  = $data['customer'];
        $isFinal   = $data['isFinal'];

        // ดึงโลโก้แบบ absolute path ที่ mPDF อ่านได้
        $companyId = $quotation->company_id ?? $quotation->customer?->company_id ?? null;
        $logoInfo = app(\App\Services\CompanyLogoService::class)->getLogoInfo($companyId);
        $logoPath = $logoInfo['path'] ?? public_path('images/logo.png');

        // Header
        $headerHtml = View::make('accounting.pdf.quotation.partials.quotation-header', compact(
            'quotation', 'customer', 'isFinal', 'logoPath'
        ))->render();

        // Footer
        $footerHtml = View::make('accounting.pdf.quotation.partials.quotation-footer', compact(
            'quotation', 'customer', 'isFinal'
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
     * - ใช้ WriteFixedPosHTML เพื่อให้ยึดตำแหน่งจากก้นหน้ากระดาษ
     * - มี spacer ใน template เพื่อกันเนื้อหามาชนทับ (signature-spacer)
     */
    protected function addSignatureBlock(Mpdf $mpdf, array $data): void
    {
        try {
            $signatureHeight = 50; // mm สูงโดยประมาณของกล่องลายเซ็น
            $bottomGap       = 10; // mm ระยะห่างเหนือ footer (เพิ่มหน่อยให้โปร)

            $lastPage = $mpdf->page; // หน้าปัจจุบันคือสุดท้ายหลัง WriteHTML
            $mpdf->SetPage($lastPage);

            // ตั้งตำแหน่ง Y จากด้านล่างของหน้า (mPDF: SetY(-n) = จากล่างขึ้นบน n mm)
            $mpdf->SetY(-($signatureHeight + $bottomGap));

            $sigHtml = View::make('pdf.partials.quotation-signature')->render();
            $mpdf->WriteHTML($sigHtml, HTMLParserMode::HTML_BODY);
            Log::info('Signature rendered via SetY method', ['page'=>$lastPage,'offset'=>$signatureHeight + $bottomGap]);
        } catch (\Throwable $e) {
            Log::warning('Add signature block failed: '.$e->getMessage());
        }
    }

    protected function shouldRenderFixedSignature(): bool
    {
    // ปิดค่า default ไว้ก่อน เพื่อให้ inline แสดงแน่นอน
    return (bool) (env('PDF_SIGNATURE_FIXED', false));
    }

    protected function shouldRenderFallbackInline(): bool
    {
        return (bool) (env('PDF_SIGNATURE_FALLBACK_INLINE', false));
    }

    /**
     * เรนเดอร์ลายเซ็นให้อยู่ชิดด้านล่างหน้าสุดท้ายแบบ adaptive พร้อม fallback mechanism:
     * 1) วัดพื้นที่คงเหลือหลัง body (current Y) แบบแม่นยำ
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
            
            Log::info('Signature placement analysis', [
                'required_height' => $requiredHeight,
                'remaining_space' => $remaining,
                'current_page' => $mpdf->page,
                'current_y' => $mpdf->y
            ]);

            $sigHtml = View::make('pdf.partials.quotation-signature')->render();
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
            Log::error('Signature adaptive render failed: '.$e->getMessage(), [
                'quotation_id' => $data['quotation']->id ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);
            
            // Emergency fallback
            $this->emergencySignaturePlacement($mpdf, View::make('pdf.partials.quotation-signature')->render());
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
        
        $totalHeight = $headerHeight + $signatureBoxHeight + $paddingHeight + ($lineHeight * 3); // 3 lines for name/date
        
        // Reduced dynamic adjustment to keep signature compact
        $contentFactor = min($mpdf->page * 0.3, 3); // Reduced from 0.5 and 5
        $adjustedHeight = $totalHeight + $contentFactor;
        
        return [
            'height' => max($adjustedHeight, 30), // Minimum 30mm (reduced from 35mm)
            'padding' => 6, // mm safety margin (reduced from 8mm)
            'base_height' => $totalHeight
        ];
    }

    /**
     * รับข้อมูลหน้าที่แม่นยำ รวมถึงการตรวจสอบ floating elements
     */
    protected function getAccuratePageInfo(Mpdf $mpdf): array
    {
        $pageHeight = $mpdf->h - $mpdf->tMargin - $mpdf->bMargin;
        $currentY = $mpdf->y - $mpdf->tMargin;
        
        // Check for potential floating content or unfinished blocks
        $adjustedY = $currentY;
        
        // Add buffer for potential margin collapse or floating elements
        $contentBuffer = 3; // mm
        $adjustedY += $contentBuffer;
        
        $remaining = max($pageHeight - $adjustedY, 0);
        
        return [
            'page_height' => $pageHeight,
            'current_y' => $currentY,
            'adjusted_y' => $adjustedY,
            'remaining' => $remaining,
            'usable_height' => $pageHeight
        ];
    }

    /**
     * พยายามวางลายเซ็นในหน้าปัจจุบัน
     */
    protected function placeSignatureOnCurrentPage(Mpdf $mpdf, string $sigHtml, float $remaining, float $requiredHeight, float $bottomPadding): bool
    {
        try {
            // Calculate push down more aggressively to bring signature closer to footer
            $pushDown = max($remaining - $requiredHeight - $bottomPadding, 0);
            
            // Minimum spacing reduced for tighter layout
            $minSpacing = 3; // mm (reduced from 5mm)
            $pushDown = max($pushDown, $minSpacing);
            
            $wrapper = sprintf(
                '<div style="margin-top:%.2fmm; page-break-inside: avoid;" class="signature-current-page">%s</div>',
                $pushDown,
                $sigHtml
            );
            
            $mpdf->WriteHTML($wrapper, HTMLParserMode::HTML_BODY);
            
            Log::info('Signature placed on current page (optimized spacing)', [
                'remaining' => $remaining,
                'push_down' => $pushDown,
                'page' => $mpdf->page,
                'required_height' => $requiredHeight,
                'bottom_padding' => $bottomPadding
            ]);
            
            return true;
        } catch (\Throwable $e) {
            Log::warning('Failed to place signature on current page: '.$e->getMessage());
            return false;
        }
    }

    /**
     * สร้างหน้าใหม่และวางลายเซ็น
     */
    protected function placeSignatureOnNewPage(Mpdf $mpdf, string $sigHtml, float $requiredHeight, float $bottomPadding): bool
    {
        try {
            $mpdf->AddPage();
            
            // Calculate position to place signature closer to footer
            // Reduce the distance from footer significantly
            $footerGap = 8; // mm - minimal gap above footer (reduced from previous large values)
            $signatureToFooterDistance = $requiredHeight + $footerGap;
            
            // Maximum distance from bottom should be much smaller for better layout
            $maxBottomPosition = 40; // mm - reduced from 60mm to bring signature closer
            $bottomPosition = min($signatureToFooterDistance, $maxBottomPosition);
            
            // Use relative positioning instead of absolute SetY
            $pageHeight = $mpdf->h - $mpdf->tMargin - $mpdf->bMargin;
            $targetY = $pageHeight - $bottomPosition;
            
            // Reduce buffer to minimize empty space above signature
            $spacerHeight = max($targetY - 5, 0); // 5mm buffer (reduced from 10mm)
            
            $wrapper = sprintf(
                '<div style="height:%.2fmm;"></div><div class="signature-new-page" style="page-break-inside: avoid;">%s</div>',
                $spacerHeight,
                $sigHtml
            );
            
            $mpdf->WriteHTML($wrapper, HTMLParserMode::HTML_BODY);
            
            Log::info('Signature placed on new page (closer to footer)', [
                'new_page' => $mpdf->page,
                'spacer_height' => $spacerHeight,
                'bottom_position' => $bottomPosition,
                'footer_gap' => $footerGap
            ]);
            
            return true;
        } catch (\Throwable $e) {
            Log::warning('Failed to place signature on new page: '.$e->getMessage());
            return false;
        }
    }

    /**
     * ระบบสำรองเมื่อการวางลายเซ็นล้มเหลว
     */
    protected function emergencySignaturePlacement(Mpdf $mpdf, string $sigHtml): void
    {
        try {
            Log::warning('Using emergency signature placement', [
                'page' => $mpdf->page,
                'y_position' => $mpdf->y
            ]);
            
            // Simple placement with basic styling
            $emergencyWrapper = sprintf(
                '<div style="margin-top:10mm; padding:5mm; border-top:1px solid #ccc;" class="signature-emergency">
                    <div style="font-size:8pt; color:#666; margin-bottom:5mm;">ลายเซ็น (Emergency Placement)</div>
                    %s
                </div>',
                $sigHtml
            );
            
            $mpdf->WriteHTML($emergencyWrapper, HTMLParserMode::HTML_BODY);
            
        } catch (\Throwable $e) {
            Log::error('Emergency signature placement failed: '.$e->getMessage());
            
            // Last resort: minimal signature
            $mpdf->WriteHTML('<div style="margin-top:15mm; text-align:center; font-size:10pt;">
                ผู้สั่งซื้อ: ________________________ &nbsp;&nbsp;&nbsp; ผู้อนุมัติ: ________________________
            </div>', HTMLParserMode::HTML_BODY);
        }
    }

    /* =======================================================================
     |  Quotation Data helpers
     * ======================================================================= */

    /**
     * จัดกลุ่มรายการสินค้า/บริการ
     */
    protected function groupQuotationItems(Quotation $quotation): array
    {
        $groups = [];

        foreach ($quotation->items as $item) {
            $key = $this->generateGroupKey($item);

            if (!isset($groups[$key])) {
                $groups[$key] = [
                    'name'   => $item->item_name ?? 'ไม่ระบุชื่องาน',
                    'pattern'=> $item->pattern ?? '',
                    'fabric' => $item->fabric_type ?? '',
                    'color'  => $item->color ?? '',
                    'unit'   => $item->unit ?? 'ชิ้น',
                    'rows'   => [],
                ];
            }

            $groups[$key]['rows'][] = [
                'size'       => $item->size ?? '',
                'quantity'   => (float) ($item->quantity ?? 0),
                'unit_price' => (float) ($item->unit_price ?? 0),
                'notes'      => $item->notes ?? '',
            ];
        }

        return array_values($groups);
    }

    /**
     * Key สำหรับจัดกลุ่มสินค้า
     */
    protected function generateGroupKey($item): string
    {
        return strtolower(implode('|', [
            $item->item_name ?? '',
            $item->pattern ?? '',
            $item->fabric_type ?? '',
            $item->color ?? '',
            $item->unit ?? '',
            $item->pricing_request_id ?? '',
        ]));
    }

    /**
     * สร้างสรุปยอดเงินจากข้อมูลฐานข้อมูลโดยตรง
     */
    protected function buildFinancialSummary(Quotation $quotation): array
    {
        return [
            'subtotal' => (float) ($quotation->subtotal ?? 0),
            'tax' => (float) ($quotation->tax_amount ?? 0),
            'total_before_discount' => (float) ($quotation->total_amount ?? 0),
            'special_discount_percentage' => (float) ($quotation->special_discount_percentage ?? 0),
            'special_discount_amount' => (float) ($quotation->special_discount_amount ?? 0),
            'has_withholding_tax' => (bool) ($quotation->has_withholding_tax ?? false),
            'withholding_tax_percentage' => (float) ($quotation->withholding_tax_percentage ?? 0),
            'withholding_tax_amount' => (float) ($quotation->withholding_tax_amount ?? 0),
            'final_total' => (float) ($quotation->final_total_amount ?? 0),
            'deposit_percentage' => (float) ($quotation->deposit_percentage ?? 0),
            'deposit_amount' => (float) ($quotation->deposit_amount ?? 0),
            'deposit_mode' => $quotation->deposit_mode ?? 'percentage',
            // Keep backward compatibility fields
            'total' => (float) ($quotation->final_total_amount ?? 0),
            'remaining' => max((float) ($quotation->final_total_amount ?? 0) - (float) ($quotation->deposit_amount ?? 0), 0),
        ];
    }

    /* =======================================================================
     |  Output helpers
     * ======================================================================= */

    /**
     * บันทึกไฟล์ PDF ลง storage
     */
    protected function savePdfFile(Mpdf $mpdf, Quotation $quotation): string
    {
        $directory = storage_path('app/public/pdfs/quotations');

        if (!is_dir($directory)) {
            @mkdir($directory, 0755, true);
        }

        $filename = sprintf(
            'quotation-%s-%s.pdf',
            $quotation->number ?? $quotation->id,
            date('Y-m-d-His')
        );

        $fullPath = $directory.DIRECTORY_SEPARATOR.$filename;
        $mpdf->Output($fullPath, 'F');

        return $fullPath;
    }

    /**
     * สร้าง URL แบบ public ให้ไฟล์ใน storage/app/public
     */
    protected function generatePublicUrl(string $filePath): string
    {
        $relative = str_replace(storage_path('app/public/'), '', $filePath);
        return url('storage/'.$relative);
    }

    /* =======================================================================
     |  System checks
     * ======================================================================= */

    /**
     * ตรวจสอบสถานะระบบ (ฟอนต์/โฟลเดอร์/วิว)
     */
    public function checkSystemStatus(): array
    {
        $status = [
            'mpdf_available'       => class_exists(Mpdf::class),
            'thai_fonts_available' => $this->checkThaiFonts(),
            'storage_writable'     => is_writable(storage_path('app/public')),
            'views_exist'          => $this->checkRequiredViews(),
            'temp_dir_writable'    => is_writable(storage_path('app/mpdf-temp')) || @mkdir(storage_path('app/mpdf-temp'), 0755, true),
        ];

        $allReady = true;
        foreach ($status as $v) {
            $allReady = $allReady && (bool) $v;
        }
        $status['all_ready'] = $allReady;

        return $status;
    }

    /**
     * มีฟอนต์ไทยขั้นต่ำหรือไม่ (Regular/Bold)
     */
    protected function checkThaiFonts(): bool
    {
        $fontPath = public_path('fonts/thsarabun/');
        $required = ['Sarabun-Regular.ttf', 'Sarabun-Bold.ttf'];

        foreach ($required as $f) {
            if (!is_file($fontPath.$f)) {
                return false;
            }
        }
        return true;
    }

    /**
     * View ที่จำเป็นต้องมี
     */
    protected function checkRequiredViews(): bool
    {
        $views = [
            'accounting.pdf.quotation.quotation-master',
            'accounting.pdf.quotation.partials.quotation-header',
            'accounting.pdf.quotation.partials.quotation-footer',
        ];

        foreach ($views as $v) {
            if (!View::exists($v)) {
                return false;
            }
        }
        return true;
    }
}
