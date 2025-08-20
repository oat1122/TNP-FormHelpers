<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\Quotation;
use App\Services\Accounting\Pdf\CustomerInfoExtractor;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Mccarlosen\LaravelMpdf\Facades\LaravelMpdf as PDF;

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
    protected function createMpdf(array $viewData): \Mpdf\Mpdf
    {
        $options = $viewData['options'];
        
        // กำหนด config พิเศษสำหรับ header/footer
        $config = [
            'mode' => 'utf-8',
            'format' => $options['format'],
            'orientation' => $options['orientation'],
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 45,      // เพิ่มพื้นที่สำหรับ header
            'margin_bottom' => 25,   // เพิ่มพื้นที่สำหรับ footer
            'margin_header' => 10,
            'margin_footer' => 10,
            'default_font' => 'thsarabun',
            'default_font_size' => 12,
        ];

        // สร้าง PDF ด้วย view template
        $pdf = PDF::loadView('pdf.quotation-master', $viewData, [], $config);

        // เพิ่ม header/footer ที่แสดงทุกหน้า
        $this->addHeaderFooter($pdf->getMpdf(), $viewData);

        return $pdf->getMpdf();
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
        $headerHtml = View::make('pdf.partials.quotation-header', [
            'quotation' => $quotation,
            'customer' => $customer,
            'isFinal' => $isFinal
        ])->render();

        // สร้าง footer HTML
        $footerHtml = View::make('pdf.partials.quotation-footer', [
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
            'pdf.quotation-master',
            'pdf.partials.quotation-header',
            'pdf.partials.quotation-footer'
        ];

        foreach ($requiredViews as $view) {
            if (!View::exists($view)) {
                return false;
            }
        }

        return true;
    }
}