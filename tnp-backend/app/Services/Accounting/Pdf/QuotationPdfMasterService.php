<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\Quotation;
use App\Services\Accounting\Pdf\CustomerInfoExtractor;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\Mpdf;

/**
 * Master PDF Service สำหรับใบเสนอราคา
 * รวมความสามารถของ mPDF และ FPDF ไว้ในที่เดียว
 * เน้นการแสดง header/footer ทุกหน้า และความเป็นมืออาชีพ
 */
class QuotationPdfMasterService
{
    /**
     * สร้าง PDF ใบเสนอราคาแบบครบถ้วน
     * 
     * @param Quotation $quotation
     * @param array $options ['format' => 'A4', 'orientation' => 'P', 'margins' => [...]]
     * @return array ['path' => string, 'url' => string, 'filename' => string, 'size' => int]
     */
    public function generatePdf(Quotation $quotation, array $options = []): array
    {
        try {
            // Load ข้อมูลที่จำเป็น
            $q = $quotation->loadMissing(['company', 'customer', 'items']);

            // ดึงข้อมูลลูกค้าผ่าน CustomerInfoExtractor
            $customer = CustomerInfoExtractor::fromQuotation($q);

            // จัดกลุ่มสินค้า/บริการ
            $groups = $this->groupQuotationItems($q);

            // คำนวณสรุปยอด
            $summary = $this->calculateSummary($q);

            // กำหนดสถานะเอกสาร
            $isFinal = in_array($q->status, ['approved', 'sent', 'completed']);

            // เตรียมข้อมูลสำหรับ template
            $viewData = [
                'quotation' => $q,
                'customer' => $customer,
                'groups' => $groups,
                'summary' => $summary,
                'isFinal' => $isFinal,
                'options' => array_merge([
                    'format' => 'A4',
                    'orientation' => 'P',
                    'showPageNumbers' => true,
                    'showWatermark' => !$isFinal,
                ], $options)
            ];

            // สร้าง PDF ด้วย mPDF
            $pdf = $this->createMpdf($viewData);

            // บันทึกไฟล์
            $filePath = $this->savePdfFile($pdf, $q);

            return [
                'path' => $filePath,
                'url' => $this->generatePublicUrl($filePath),
                'filename' => basename($filePath),
                'size' => file_exists($filePath) ? filesize($filePath) : 0,
                'type' => $isFinal ? 'final' : 'preview'
            ];

        } catch (\Exception $e) {
            Log::error('QuotationPdfMasterService::generatePdf error: ' . $e->getMessage(), [
                'quotation_id' => $quotation->id,
                'quotation_number' => $quotation->number ?? 'N/A'
            ]);
            throw $e;
        }
    }

    /**
     * สร้าง mPDF instance พร้อม config ที่เหมาะสม
     */
    protected function createMpdf(array $viewData): Mpdf
    {
        $options = $viewData['options'] ?? [];

        // Merge font directories and data with custom Thai fonts
        $defaultConfig = (new ConfigVariables())->getDefaults();
        $fontDirs = $defaultConfig['fontDir'];
        $defaultFontConfig = (new FontVariables())->getDefaults();
        $fontData = $defaultFontConfig['fontdata'];

    $customFontDir = config('pdf.custom_font_dir', public_path('fonts/thsarabun/'));
    $customFontData = config('pdf.custom_font_data', [
            'thsarabun' => [
                'R' => 'Sarabun-Regular.ttf',
                'B' => 'Sarabun-Bold.ttf',
                'I' => 'Sarabun-Italic.ttf',
                'BI' => 'Sarabun-BoldItalic.ttf',
            ],
        ]);
    $hasThaiFonts = $this->checkThaiFonts();

        $config = [
            'mode' => 'utf-8',
            'format' => $options['format'] ?? 'A4',
            'orientation' => $options['orientation'] ?? 'P',
            // Give generous content margins and let mPDF auto-stretch to fit header/footer
            'margin_left' => 15,   // mm
            'margin_right' => 15,  // mm
            'margin_top' => 55,    // mm, base min height for header area
            'margin_bottom' => 32, // mm, base min height for footer area
            'margin_header' => 8,  // mm, distance from top to header content
            'margin_footer' => 8,  // mm, distance from bottom to footer content
            'setAutoTopMargin' => 'stretch',
            'setAutoBottomMargin' => 'stretch',
            'default_font' => $hasThaiFonts ? 'thsarabun' : 'dejavusans',
            'default_font_size' => 12,
            'fontDir' => $hasThaiFonts ? array_merge($fontDirs, [$customFontDir]) : $fontDirs,
            'fontdata' => $hasThaiFonts ? ($fontData + $customFontData) : $fontData,
            'tempDir' => storage_path('app/mpdf-temp'),
        ];

        // Ensure temp and output directories exist
        if (!is_dir($config['tempDir'])) {
            @mkdir($config['tempDir'], 0755, true);
        }

        $mpdf = new Mpdf($config);

        // Header/footer and watermark
        $this->addHeaderFooter($mpdf, $viewData);

        // Render body HTML
    $html = View::make('accounting.pdf.quotation.quotation-master', $viewData)->render();
        $mpdf->WriteHTML($html);

        return $mpdf;
    }

    /**
     * เพิ่ม header และ footer ที่แสดงทุกหน้า
     */
    protected function addHeaderFooter(\Mpdf\Mpdf $mpdf, array $data): void
    {
        $quotation = $data['quotation'];
        $customer = $data['customer'];
        $isFinal = $data['isFinal'];

        // สร้าง header HTML
    $headerHtml = View::make('accounting.pdf.quotation.partials.quotation-header', [
            'quotation' => $quotation,
            'customer' => $customer,
            'isFinal' => $isFinal
        ])->render();

        // สร้าง footer HTML
    $footerHtml = View::make('accounting.pdf.quotation.partials.quotation-footer', [
            'quotation' => $quotation,
            'customer' => $customer,
            'isFinal' => $isFinal
        ])->render();

        // กำหนด header/footer ให้ mPDF
        $mpdf->SetHTMLHeader($headerHtml);
        $mpdf->SetHTMLFooter($footerHtml);

        // เพิ่ม watermark สำหรับเอกสาร preview
        if (!$isFinal && $data['options']['showWatermark']) {
            $mpdf->SetWatermarkText('PREVIEW', 0.1);
            $mpdf->showWatermarkText = true;
        }
    }

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
                    'name' => $item->item_name ?? 'ไม่ระบุชื่องาน',
                    'pattern' => $item->pattern ?? '',
                    'fabric' => $item->fabric_type ?? '',
                    'color' => $item->color ?? '',
                    'unit' => $item->unit ?? 'ชิ้น',
                    'rows' => [],
                ];
            }

            $groups[$key]['rows'][] = [
                'size' => $item->size ?? '',
                'quantity' => (float)($item->quantity ?? 0),
                'unit_price' => (float)($item->unit_price ?? 0),
                'notes' => $item->notes ?? '',
            ];
        }

        return array_values($groups);
    }

    /**
     * สร้าง key สำหรับการจัดกลุ่มสินค้า
     */
    protected function generateGroupKey($item): string
    {
        return strtolower(implode('|', [
            $item->item_name ?? '',
            $item->pattern ?? '',
            $item->fabric_type ?? '',
            $item->color ?? '',
            $item->unit ?? '',
            $item->pricing_request_id ?? ''
        ]));
    }

    /**
     * คำนวณสรุปยอดเงิน
     */
    protected function calculateSummary(Quotation $quotation): array
    {
        $subtotal = (float)($quotation->subtotal ?? 0);
        $tax = (float)($quotation->tax_amount ?? 0);
        $total = (float)($quotation->total_amount ?? ($subtotal + $tax));
        $depositPct = (float)($quotation->deposit_percentage ?? 0);
        $depositAmount = $depositPct > 0 ? round(($total * $depositPct) / 100, 2) : 0.0;
        $remaining = max($total - $depositAmount, 0);

        return [
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $total,
            'deposit_percentage' => $depositPct,
            'deposit_amount' => $depositAmount,
            'remaining' => $remaining,
        ];
    }

    /**
     * บันทึกไฟล์ PDF
     */
    protected function savePdfFile(\Mpdf\Mpdf $mpdf, Quotation $quotation): string
    {
        $directory = storage_path('app/public/pdfs/quotations');
        
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filename = sprintf(
            'quotation-%s-%s.pdf',
            $quotation->number ?? $quotation->id,
            date('Y-m-d-His')
        );

        $fullPath = $directory . DIRECTORY_SEPARATOR . $filename;
        $mpdf->Output($fullPath, 'F');

        return $fullPath;
    }

    /**
     * สร้าง URL สาธารณะสำหรับไฟล์ PDF
     */
    protected function generatePublicUrl(string $filePath): string
    {
        $relativePath = str_replace(storage_path('app/public/'), '', $filePath);
        return url('storage/' . $relativePath);
    }

    /**
     * สร้าง PDF แบบ stream สำหรับ download ทันที
     */
    public function streamPdf(Quotation $quotation, array $options = []): \Symfony\Component\HttpFoundation\Response
    {
        $q = $quotation->loadMissing(['company', 'customer', 'items']);
        $customer = CustomerInfoExtractor::fromQuotation($q);
        $groups = $this->groupQuotationItems($q);
        $summary = $this->calculateSummary($q);
        $isFinal = in_array($q->status, ['approved', 'sent', 'completed']);

        $viewData = [
            'quotation' => $q,
            'customer' => $customer,
            'groups' => $groups,
            'summary' => $summary,
            'isFinal' => $isFinal,
            'options' => array_merge(['format' => 'A4', 'orientation' => 'P'], $options)
        ];

    $mpdf = $this->createMpdf($viewData);
        
        $filename = sprintf(
            'quotation-%s.pdf',
            $q->number ?? $q->id
        );

        return response($mpdf->Output('', 'S'))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="' . $filename . '"');
    }

    /**
     * ตรวจสอบสถานะความพร้อมของระบบ
     */
    public function checkSystemStatus(): array
    {
        $status = [
            'mpdf_available' => class_exists(\Mpdf\Mpdf::class),
            'thai_fonts_available' => $this->checkThaiFonts(),
            'storage_writable' => is_writable(storage_path('app/public')),
            'views_exist' => $this->checkRequiredViews(),
            'temp_dir_writable' => is_writable(storage_path('app/mpdf-temp')) || @mkdir(storage_path('app/mpdf-temp'), 0755, true),
        ];

        $status['all_ready'] = array_reduce($status, function($carry, $item) {
            return $carry && $item;
        }, true);

    return $status;
    }

    /**
     * ตรวจสอบฟอนต์ไทย
     */
    protected function checkThaiFonts(): bool
    {
        $fontPath = public_path('fonts/thsarabun/');
        $requiredFonts = ['Sarabun-Regular.ttf', 'Sarabun-Bold.ttf'];
        
        foreach ($requiredFonts as $font) {
            if (!file_exists($fontPath . $font)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * ตรวจสอบ view templates ที่จำเป็น
     */
    protected function checkRequiredViews(): bool
    {
        $requiredViews = [
            'accounting.pdf.quotation.quotation-master',
            'accounting.pdf.quotation.partials.quotation-header',
            'accounting.pdf.quotation.partials.quotation-footer'
        ];

        foreach ($requiredViews as $view) {
            if (!View::exists($view)) {
                return false;
            }
        }

        return true;
    }
}