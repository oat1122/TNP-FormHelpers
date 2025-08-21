<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\Quotation;
use App\Services\Accounting\Pdf\CustomerInfoExtractor;
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
        $summary  = $this->calculateSummary($q);

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
            'margin_left'         => 22,
            'margin_right'        => 22,
            'margin_top'          => 26,
            'margin_bottom'       => 24,
            'setAutoTopMargin'    => 'stretch',
            'setAutoBottomMargin' => 'stretch',

            'default_font'        => $hasThaiFonts ? 'thsarabun' : 'dejavusans',
            'default_font_size'   => 12,
            'fontDir'             => $hasThaiFonts ? array_merge($fontDirs, [$customFontDir]) : $fontDirs,
            'fontdata'            => $hasThaiFonts ? ($fontData + $customFontData) : $fontData,

            'tempDir'             => storage_path('app/mpdf-temp'),
            'useOTL'              => 0xFF,
            'useKerning'          => true,
            'autoLangToFont'      => true,
            'autoScriptToLang'    => true,
        ];

        if (!is_dir($config['tempDir'])) {
            @mkdir($config['tempDir'], 0755, true);
        }

        $mpdf = new Mpdf($config);

        /* 1) โหลด CSS (สำคัญ: ให้มาก่อน Header/Footer/Body เสมอ) */
        $this->writeCss($mpdf, $this->cssFiles());

        /* 2) ตั้งค่า Header/Footer + Watermark */
        $this->addHeaderFooter($mpdf, $viewData);

        /* 3) เขียน HTML ของเนื้อหา */
        $html = View::make('accounting.pdf.quotation.quotation-master', $viewData)->render();
        $mpdf->WriteHTML($html, HTMLParserMode::HTML_BODY);

        return $mpdf;
    }

    /**
     * ระบุรายการไฟล์ CSS ที่ต้องโหลด (แก้ path ตามโปรเจกต์จริงของมดได้)
     * แนะนำให้แยกไฟล์ตามหน้าที่ เพื่อจัดระเบียบและ override ได้ง่าย
     *
     * ตัวอย่างไฟล์:
     * tnp-backend\resources\views\pdf\partials\quotation-header.css
     * tnp-backend\resources\views\accounting\pdf\quotation\quotation-master.css
     */
    protected function cssFiles(): array
    {
        return [
            resource_path('views\accounting\pdf\quotation\quotation-master.css'),
            resource_path('views\pdf\partials\quotation-header.css'),
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

        // Header
        $headerHtml = View::make('accounting.pdf.quotation.partials.quotation-header', compact(
            'quotation', 'customer', 'isFinal'
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
     * คำนวณสรุปยอดเงิน
     */
    protected function calculateSummary(Quotation $quotation): array
    {
        $subtotal     = (float) ($quotation->subtotal ?? 0);
        $tax          = (float) ($quotation->tax_amount ?? 0);
        $total        = (float) ($quotation->total_amount ?? ($subtotal + $tax));
        $depositPct   = (float) ($quotation->deposit_percentage ?? 0);
        $depositAmt   = $depositPct > 0 ? round(($total * $depositPct) / 100, 2) : 0.0;
        $remainingAmt = max($total - $depositAmt, 0);

        return [
            'subtotal'           => $subtotal,
            'tax'                => $tax,
            'total'              => $total,
            'deposit_percentage' => $depositPct,
            'deposit_amount'     => $depositAmt,
            'remaining'          => $remainingAmt,
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
