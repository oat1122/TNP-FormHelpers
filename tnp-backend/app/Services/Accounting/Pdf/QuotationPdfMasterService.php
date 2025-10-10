<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\Quotation;
use App\Services\Accounting\Pdf\CustomerInfoExtractor;
use Illuminate\Support\Facades\View;
use Mpdf\Mpdf;

/**
 * Master PDF Service สำหรับใบเสนอราคา
 * - สืบทอดจาก BasePdfMasterService เพื่อใช้ฟังก์ชั่นร่วมกัน
 * - มีเฉพาะ logic ที่เป็น Quotation-specific
 */
class QuotationPdfMasterService extends BasePdfMasterService
{
    protected function getFilenamePrefix(): string
    {
        return 'quotation';
    }

    protected function getTemplatePath(array $viewData): string
    {
        return 'accounting.pdf.quotation.quotation-master';
    }
    
    protected function getSignatureTemplatePath(): string
    {
        return 'pdf.partials.quotation-signature';
    }

    protected function cssFiles(): array
    {
        return [
            resource_path('views/accounting/pdf/shared/pdf-shared-base.css'),
            resource_path('views/accounting/pdf/quotation/quotation-master.css'),
            resource_path('views/pdf/partials/quotation-header.css'),
        ];
    }

    protected function addHeaderFooter(Mpdf $mpdf, array $data): void
    {
        $quotation = $data['quotation'];
        $customer = $data['customer'];
        $isFinal = $data['isFinal'];

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

        // Watermark for non-final quotations
        if (!$isFinal && ($data['options']['showWatermark'] ?? true)) {
            $mpdf->SetWatermarkText('PREVIEW', 0.1);
            $mpdf->showWatermarkText = true;
        }
    }

    protected function buildViewData(object $quotation, array $options = []): array
    {
        /** @var Quotation $q */
        $q = $quotation->loadMissing(['company', 'customer', 'items', 'creator']);

        $customer = CustomerInfoExtractor::fromQuotation($q);
        $groups = $this->groupQuotationItems($q);
        $summary = $this->buildFinancialSummary($q);

        $isFinal = in_array($q->status, ['approved', 'sent', 'completed'], true);

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

    // =======================================================================
    // |  Quotation Specific Helpers
    // =======================================================================

    /**
     * จัดกลุ่มรายการสินค้า/บริการใน Quotation
     * @return array<mixed>
     */
    protected function groupQuotationItems(Quotation $quotation): array
    {
        $items = $quotation->items ?? collect();
        
        if ($items->isEmpty()) {
            return [];
        }

        $groups = [];

        foreach ($items as $item) {
            // สร้าง key สำหรับจัดกลุ่ม
            $groupKey = $this->generateQuotationGroupKey($item);

            if (!isset($groups[$groupKey])) {
                $groups[$groupKey] = [
                    'name' => $item->name ?? 'ไม่ระบุชื่องาน',
                    'pattern' => $item->pattern,
                    'fabric' => $item->fabric,
                    'color' => $item->color,
                    'unit' => $item->unit ?? 'ชิ้น',
                    'rows' => []
                ];
            }

            // เพิ่มรายการลงในกลุ่ม
            $groups[$groupKey]['rows'][] = [
                'size' => $item->size ?? '-',
                'quantity' => (float)($item->quantity ?? 0),
                'unit_price' => (float)($item->unit_price ?? 0),
                'discount_amount' => (float)($item->discount_amount ?? 0),
                'description' => $item->description,
            ];
        }

        return array_values($groups);
    }

    /**
     * สร้าง key สำหรับจัดกลุ่มรายการใน Quotation
     */
    protected function generateQuotationGroupKey(object $item): string
    {
        $keyParts = [
            $item->name ?? '',
            $item->pattern ?? '',
            $item->fabric ?? '',
            $item->color ?? ''
        ];
        
        return md5(implode('|', $keyParts));
    }

    /**
     * สร้างสรุปทางการเงินสำหรับ Quotation
     * @return array<string, mixed>
     */
    protected function buildFinancialSummary(Quotation $quotation): array
    {
        return [
            'subtotal' => (float)($quotation->subtotal ?? 0),
            'special_discount_percentage' => $quotation->special_discount_percentage ?? 0,
            'special_discount_amount' => (float)($quotation->special_discount_amount ?? 0),
            'has_vat' => (bool)($quotation->has_vat ?? true),
            'vat_percentage' => (float)($quotation->vat_percentage ?? 7.00),
            'vat_amount' => (float)($quotation->vat_amount ?? 0),
            'has_withholding_tax' => (bool)($quotation->has_withholding_tax ?? false),
            'withholding_tax_percentage' => (float)($quotation->withholding_tax_percentage ?? 0),
            'withholding_tax_amount' => (float)($quotation->withholding_tax_amount ?? 0),
            'total_amount' => (float)($quotation->total_amount ?? 0),
            'deposit_mode' => $quotation->deposit_mode ?? 'percentage',
            'deposit_percentage' => (float)($quotation->deposit_percentage ?? 0),
            'deposit_amount' => (float)($quotation->deposit_amount ?? 0),
        ];
    }
}