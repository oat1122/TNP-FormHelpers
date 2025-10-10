<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\DeliveryNote;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\HTMLParserMode;
use Mpdf\Mpdf;

/**
 * Master PDF Service สำหรับใบส่งของ (Delivery Note)
 * - อ้างอิงดีไซน์จาก Quotation/Invoice Master
 * - โหลด CSS กลาง + Header แล้วเรนเดอร์เนื้อหา
 */
class DeliveryNotePdfMasterService
{
    /**
     * สร้าง PDF เป็นไฟล์ใน storage พร้อม URL
     *
     * @param DeliveryNote $deliveryNote
     * @param array $options
     * @return array{path:string,url:string,filename:string,size:int,type:string}
     */
    public function generatePdf(DeliveryNote $deliveryNote, array $options = []): array
    {
        try {
            $viewData = $this->buildViewData($deliveryNote, $options);

            // 1) mPDF + CSS + Header/Footer + Body
            $mpdf = $this->createMpdf($viewData);

            // 2) บันทึกไฟล์
            $filePath = $this->savePdfFile($mpdf, $viewData['deliveryNote']);

            return [
                'path'     => $filePath,
                'url'      => $this->generatePublicUrl($filePath),
                'filename' => basename($filePath),
                'size'     => is_file($filePath) ? filesize($filePath) : 0,
                'type'     => $viewData['isFinal'] ? 'final' : 'preview',
            ];
        } catch (\Throwable $e) {
            Log::error('DeliveryNotePdfMasterService::generatePdf error: '.$e->getMessage(), [
                'delivery_note_id'     => $deliveryNote->id ?? null,
                'delivery_note_number' => $deliveryNote->number ?? 'N/A',
                'trace'                => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Stream PDF แสดงบนเบราว์เซอร์ทันที
     */
    public function streamPdf(DeliveryNote $deliveryNote, array $options = [])
    {
        $viewData = $this->buildViewData($deliveryNote, $options);

        $mpdf = $this->createMpdf($viewData);

        $filename = sprintf('delivery-note-%s.pdf', $viewData['deliveryNote']->number ?? $viewData['deliveryNote']->id);

        return response($mpdf->Output('', 'S'))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="'.$filename.'"');
    }

    /* =======================================================================
     |  Core builders
     * ======================================================================= */

    protected function buildViewData(DeliveryNote $dn, array $options = []): array
    {
        $d = $dn->loadMissing(['company', 'customer', 'items', 'creator', 'manager', 'deliveryPerson']);

        // ใช้ตัว extract กลางเพื่อให้ได้ข้อมูลลูกค้าแบบ normalize
        $customer = \App\Services\Accounting\Pdf\CustomerInfoExtractor::fromDeliveryNote($d);
        $groups   = $this->groupDeliveryNoteItems($d);

        $isFinal = in_array($d->status, ['shipping', 'in_transit', 'delivered', 'completed'], true);

        return [
            'deliveryNote' => $d,
            'customer'     => $customer,
            'groups'       => $groups,
            'isFinal'      => $isFinal,
            'options'      => array_merge([
                'format'          => 'A4',
                'orientation'     => 'P',
                'showPageNumbers' => true,
                'showWatermark'   => !$isFinal,
            ], $options),
        ];
    }

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

        // 1) CSS
        $this->writeCss($mpdf, $this->cssFiles());

        // 2) Header/Footer + Watermark
        $this->addHeaderFooter($mpdf, $viewData);

        // 3) Body
        $html = View::make('accounting.pdf.delivery-note.delivery-note-master', $viewData)->render();
        $mpdf->WriteHTML($html, HTMLParserMode::HTML_BODY);

        // 4) Render signature at the bottom of the last page (adaptive)
        $this->renderSignatureAdaptive($mpdf, $viewData);

        return $mpdf;
    }

    protected function cssFiles(): array
    {
        return [
            resource_path('views/accounting/pdf/shared/pdf-shared-base.css'),
            resource_path('views/accounting/pdf/delivery-note/delivery-note-master.css'),
            // ใช้ header CSS ของ invoice ที่แชร์สไตล์หัวเอกสารพื้นฐานไว้แล้ว
            resource_path('views/pdf/partials/invoice-header.css'),
        ];
    }

    /**
     * Render a signature section near the bottom of the last page,
     * adapting to remaining space; if insufficient, add a new page.
     */
    protected function renderSignatureAdaptive(Mpdf $mpdf, array $data): void
    {
        try {
            // Calculate signature dimensions dynamically (keep parity with Quotation)
            $signatureDimensions = $this->calculateSignatureDimensions($mpdf);
            $requiredHeight = $signatureDimensions['height'];
            $bottomPadding  = $signatureDimensions['padding'];

            // Get accurate page measurements
            $pageInfo  = $this->getAccuratePageInfo($mpdf);
            $remaining = $pageInfo['remaining'];

            Log::info('Delivery signature placement analysis', [
                'required_height' => $requiredHeight,
                'remaining_space' => $remaining,
                'current_page'    => $mpdf->page,
                'current_y'       => $mpdf->y,
            ]);

            $sigHtml = View::make('accounting.pdf.delivery-note.partials.delivery-note-signature', $data)->render();
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
                $this->emergencySignaturePlacement($mpdf, $sigHtml, $data);
            }

        } catch (\Throwable $e) {
            Log::error('Delivery signature adaptive render failed: '.$e->getMessage(), [
                'delivery_note_id' => $data['deliveryNote']->id ?? 'unknown',
                'trace'            => $e->getTraceAsString(),
            ]);

            // Emergency fallback
            $this->emergencySignaturePlacement($mpdf, View::make('accounting.pdf.delivery-note.partials.delivery-note-signature', $data)->render(), $data);
        }
    }

    /**
     * คำนวณขนาดที่ต้องการสำหรับลายเซ็นแบบ dynamic (ให้เหมือนกับ Quotation)
     */
    protected function calculateSignatureDimensions(Mpdf $mpdf): array
    {
        $lineHeight         = 4;  // mm per line
        $headerHeight       = 6;  // mm for signature headers
        $paddingHeight      = 8;  // mm internal padding and spacing
        $signatureBoxHeight = 12; // mm for actual signature area

        $totalHeight   = $headerHeight + $signatureBoxHeight + $paddingHeight + ($lineHeight * 3);
        $contentFactor = min($mpdf->page * 0.3, 3);
        $adjustedHeight = $totalHeight + $contentFactor;

        return [
            'height' => max($adjustedHeight, 30), // Minimum 30mm
            'padding' => 6, // mm safety margin
            'base_height' => $totalHeight,
        ];
    }

    /**
     * รับข้อมูลหน้าที่แม่นยำ รวมถึง buffer สำหรับ floating/margin collapse
     */
    protected function getAccuratePageInfo(Mpdf $mpdf): array
    {
        $pageHeight = $mpdf->h - $mpdf->tMargin - $mpdf->bMargin;
        $currentY   = $mpdf->y - $mpdf->tMargin;

        $adjustedY = $currentY + 3; // add small buffer
        $remaining = max($pageHeight - $adjustedY, 0);

        return [
            'page_height'   => $pageHeight,
            'current_y'     => $currentY,
            'adjusted_y'    => $adjustedY,
            'remaining'     => $remaining,
            'usable_height' => $pageHeight,
        ];
    }

    /**
     * พยายามวางลายเซ็นในหน้าปัจจุบันด้วยการดัน margin-top
     */
    protected function placeSignatureOnCurrentPage(Mpdf $mpdf, string $sigHtml, float $remaining, float $requiredHeight, float $bottomPadding): bool
    {
        try {
            $pushDown   = max($remaining - $requiredHeight - $bottomPadding, 0);
            $minSpacing = 3; // tighter layout
            $pushDown   = max($pushDown, $minSpacing);

            $wrapper = sprintf(
                '<div style="margin-top:%.2fmm; page-break-inside: avoid;" class="signature-current-page">%s</div>',
                $pushDown,
                $sigHtml
            );

            $mpdf->WriteHTML($wrapper, HTMLParserMode::HTML_BODY);

            Log::info('Delivery signature placed on current page (optimized spacing)', [
                'remaining'       => $remaining,
                'push_down'       => $pushDown,
                'page'            => $mpdf->page,
                'required_height' => $requiredHeight,
                'bottom_padding'  => $bottomPadding,
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::warning('Failed to place delivery signature on current page: '.$e->getMessage());
            return false;
        }
    }

    /**
     * สร้างหน้าใหม่และวางลายเซ็นให้ชิด footer มากขึ้น
     */
    protected function placeSignatureOnNewPage(Mpdf $mpdf, string $sigHtml, float $requiredHeight, float $bottomPadding): bool
    {
        try {
            $mpdf->AddPage();

            $footerGap = 8; // mm minimal gap above footer
            $signatureToFooterDistance = $requiredHeight + $footerGap;
            $maxBottomPosition = 40; // mm bring signature closer
            $bottomPosition = min($signatureToFooterDistance, $maxBottomPosition);

            $pageHeight = $mpdf->h - $mpdf->tMargin - $mpdf->bMargin;
            $targetY    = $pageHeight - $bottomPosition;
            $spacerHeight = max($targetY - 5, 0); // 5mm buffer

            $wrapper = sprintf(
                '<div style="height:%.2fmm;"></div><div class="signature-new-page" style="page-break-inside: avoid;">%s</div>',
                $spacerHeight,
                $sigHtml
            );

            $mpdf->WriteHTML($wrapper, HTMLParserMode::HTML_BODY);

            Log::info('Delivery signature placed on new page (closer to footer)', [
                'new_page'       => $mpdf->page,
                'spacer_height'  => $spacerHeight,
                'bottom_position'=> $bottomPosition,
                'footer_gap'     => $footerGap,
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::warning('Failed to place delivery signature on new page: '.$e->getMessage());
            return false;
        }
    }

    /**
     * ระบบสำรองเมื่อการวางลายเซ็นล้มเหลว
     */
    protected function emergencySignaturePlacement(Mpdf $mpdf, string $sigHtml, array $data = []): void
    {
        try {
            Log::warning('Using emergency delivery signature placement', [
                'page'       => $mpdf->page,
                'y_position' => $mpdf->y,
                'delivery_note_id' => $data['deliveryNote']->id ?? null,
            ]);

            $emergencyWrapper = sprintf(
                '<div style="margin-top:10mm; padding:5mm; border-top:1px solid #ccc;" class="signature-emergency">
                    <div style="font-size:8pt; color:#666; margin-bottom:5mm;">ลายเซ็น (Emergency Placement)</div>
                    %s
                </div>',
                $sigHtml
            );

            $mpdf->WriteHTML($emergencyWrapper, HTMLParserMode::HTML_BODY);
        } catch (\Throwable $e) {
            Log::error('Emergency delivery signature placement failed: '.$e->getMessage());
            $mpdf->WriteHTML('<div style="margin-top:15mm; text-align:center; font-size:10pt;">
                ผู้รับสินค้า: ________________________ &nbsp;&nbsp;&nbsp; ผู้ส่งสินค้า: ________________________
            </div>', HTMLParserMode::HTML_BODY);
        }
    }

    protected function writeCss(Mpdf $mpdf, array $files): void
    {
        foreach ($files as $file) {
            if ($file && is_file($file)) {
                $mpdf->WriteHTML(file_get_contents($file), HTMLParserMode::HEADER_CSS);
            }
        }
    }

    protected function addHeaderFooter(Mpdf $mpdf, array $data): void
    {
        $deliveryNote = $data['deliveryNote'];
        $customer     = $data['customer'];
        $isFinal      = $data['isFinal'];

        // Header (ใช้ partial ที่มีอยู่แล้ว)
        $headerHtml = View::make('accounting.pdf.delivery-note.partials.delivery-note-header', compact('deliveryNote', 'customer', 'isFinal'))->render();

        $mpdf->SetHTMLHeader($headerHtml);

        // ไม่มี footer เฉพาะกิจ ใช้ footer เปล่าๆ ไว้ก่อนหากต้องการหน้าปัจจุบัน/ทั้งหมด ใส่ภายหลังได้
        if (!empty($data['options']['showPageNumbers'])) {
            $mpdf->SetHTMLFooter('<div style="text-align: right; font-size: 9pt; color: #888;">หน้า {PAGENO} / {nbpg}</div>');
        }

        if (!$isFinal && ($data['options']['showWatermark'] ?? true)) {
            $mpdf->SetWatermarkText('PREVIEW', 0.1);
            $mpdf->showWatermarkText = true;
        }
    }

    /* =======================================================================
     |  Grouping helpers
     * ======================================================================= */

    protected function groupDeliveryNoteItems(DeliveryNote $dn): array
    {
        $groups = [];

        foreach ($dn->items as $item) {
            $key = strtolower(implode('|', [
                $item->item_name ?? '',
                $item->pattern ?? '',
                $item->fabric_type ?? '',
                $item->color ?? '',
                $item->unit ?? 'ชิ้น',
            ]));

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
                'size'     => $item->size ?? '-',
                'quantity' => (float) ($item->delivered_quantity ?? 0),
            ];
        }

        return array_values($groups);
    }

    /* =======================================================================
     |  Output helpers
     * ======================================================================= */

    protected function savePdfFile(Mpdf $mpdf, DeliveryNote $dn): string
    {
        $directory = storage_path('app/public/pdfs/delivery-notes');

        if (!is_dir($directory)) {
            @mkdir($directory, 0755, true);
        }

        $filename = sprintf('delivery-note-%s-%s.pdf', $dn->number ?? $dn->id, date('Y-m-d-His'));

        $fullPath = $directory.DIRECTORY_SEPARATOR.$filename;
        $mpdf->Output($fullPath, 'F');

        return $fullPath;
    }

    protected function generatePublicUrl(string $filePath): string
    {
        $relative = str_replace(storage_path('app/public/'), '', $filePath);
        // Normalize backslashes to forward slashes for valid URLs on Windows
        $relative = str_replace('\\', '/', $relative);
        return url('storage/'.$relative);
    }

    /* =======================================================================
     |  System checks
     * ======================================================================= */

    public function checkSystemStatus(): array
    {
        $status = [
            'mpdf_available'       => class_exists(Mpdf::class),
            'thai_fonts_available' => $this->checkThaiFonts(),
            'storage_writable'     => is_writable(storage_path('app/public')),
            'views_exist'          => View::exists('accounting.pdf.delivery-note.delivery-note-master') && View::exists('accounting.pdf.delivery-note.partials.delivery-note-header'),
            'temp_dir_writable'    => is_writable(storage_path('app/mpdf-temp')) || @mkdir(storage_path('app/mpdf-temp'), 0755, true),
        ];

        $allReady = true;
        foreach ($status as $v) { $allReady = $allReady && (bool) $v; }
        $status['all_ready'] = $allReady;
        return $status;
    }

    protected function checkThaiFonts(): bool
    {
        $fontPath = public_path('fonts/thsarabun/');
        $required = ['Sarabun-Regular.ttf', 'Sarabun-Bold.ttf'];
        foreach ($required as $f) { if (!is_file($fontPath.$f)) { return false; } }
        return true;
    }
}