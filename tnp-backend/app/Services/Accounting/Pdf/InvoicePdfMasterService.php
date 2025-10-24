<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\Invoice;
use App\Services\Accounting\Pdf\CustomerInfoExtractor;
use Illuminate\Support\Facades\View;
use Mpdf\Mpdf;

/**
 * Master PDF Service สำหรับใบแจ้งหนี้/วางบิล
 * - สืบทอดจาก BasePdfMasterService เพื่อใช้ฟังก์ชั่นร่วมกัน
 * - มีเฉพาะ logic ที่เป็น Invoice-specific
 */
class InvoicePdfMasterService extends BasePdfMasterService
{
    protected function getFilenamePrefix(): string
    {
        return 'invoice';
    }

    protected function getTemplatePath(array $viewData): string
    {
        $depositMode = $viewData['options']['deposit_mode'] ?? 'before';
        return ($depositMode === 'after')
            ? 'accounting.pdf.invoice.invoice-deposit-after'
            : 'accounting.pdf.invoice.invoice-master';
    }
    
    protected function getSignatureTemplatePath(): string
    {
        return 'accounting.pdf.invoice.partials.invoice-signature';
    }

    protected function cssFiles(): array
    {
        return [
            resource_path('views/accounting/pdf/shared/pdf-shared-base.css'),
            resource_path('views/accounting/pdf/invoice/invoice-master.css'),
            resource_path('views/pdf/partials/invoice-header.css'),
        ];
    }

    protected function addHeaderFooter(Mpdf $mpdf, array $data): void
    {
        $invoice  = $data['invoice'];
        $customer = $data['customer'];
        $isFinal  = $data['isFinal'];

        // Header (คงเดิม)
        $summary = $data['summary'] ?? [];
        $headerHtml = View::make('accounting.pdf.invoice.partials.invoice-header', compact(
            'invoice', 'customer', 'isFinal', 'summary'
        ))->render();

        // --- ส่วนที่แก้ไข ---

        // 1. Render a normal footer for all pages
        $footerHtml = View::make('accounting.pdf.invoice.partials.invoice-footer', compact(
            'invoice', 'customer', 'isFinal'
        ))->render();

        // 2. Render the special last page footer (with signature)
        $lastPageFooterHtml = View::make('accounting.pdf.invoice.partials.invoice-footer-lastpage', compact(
            'invoice', 'customer', 'isFinal'
        ))->render();

        // 3. Set the footers in Mpdf
        $mpdf->SetHTMLHeader($headerHtml);
        $mpdf->SetHTMLFooter($footerHtml); // Default footer for pages 1, 2, ...
        $mpdf->SetHTMLFooter($lastPageFooterHtml, 'L'); // Special footer for the LAST page ('L' flag)

        // --- จบส่วนที่แก้ไข ---

        // Watermark logic (คงเดิม)
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

    protected function buildViewData(object $invoice, array $options = []): array
    {
        /** @var Invoice $i */
        \Log::info("🔍 PDF buildViewData - Start for Invoice ID: {$invoice->id}, Type: {$invoice->type}");
        
        $i = $invoice->loadMissing(['company', 'customer', 'quotation', 'quotation.items', 'items', 'creator', 'manager', 'referenceInvoice']);

        // Log relationship loading status
        $itemsLoaded = $i->relationLoaded('items');
        $itemCount = $itemsLoaded ? $i->items->count() : 'NOT LOADED';
        \Log::info("🔍 PDF buildViewData - Items relationship loaded: " . ($itemsLoaded ? 'YES' : 'NO') . ", Count: {$itemCount}");

        // Allow runtime override of document header type (ไม่บันทึกลง DB)
        if (!empty($options['document_header_type'])) {
            $i->document_header_type = $options['document_header_type'];
        }

        $customer = CustomerInfoExtractor::fromInvoice($i);
        
        \Log::info("🔍 PDF buildViewData - Calling getInvoiceItems...");
        $items    = $this->getInvoiceItems($i);
        \Log::info("🔍 PDF buildViewData - getInvoiceItems returned " . count($items) . " items");
        
        if (count($items) > 0) {
            \Log::info("🔍 PDF buildViewData - First item: " . json_encode($items[0]));
        }
        
        $summary  = $this->buildFinancialSummary($i);
        
        // สร้างข้อมูล groups สำหรับ deposit-after mode
        $groups = $this->groupInvoiceItems($i);
        \Log::info("🔍 PDF buildViewData - groupInvoiceItems returned " . count($groups) . " groups");

        $isFinal  = in_array($i->status, ['approved', 'sent', 'completed', 'partial_paid', 'fully_paid'], true);

        \Log::info("🔍 PDF buildViewData - Final data: items=" . count($items) . ", groups=" . count($groups));

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

    // =======================================================================
    // |  Invoice Specific Helpers
    // =======================================================================

    /**
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
     * ดึงรายการสินค้า/บริการจาก Invoice - แก้ไข: ใช้เฉพาะ invoice_items เท่านั้น
     * @return array<mixed>
     */
    protected function getInvoiceItems(Invoice $invoice): array
    {
        \Log::info("🔍 getInvoiceItems - Invoice ID: {$invoice->id}");
        
        // ตรวจสอบให้แน่ใจว่า relationship 'items' ถูกโหลดแล้ว
        // การเรียก $invoice->items จะพยายามโหลดถ้ายังไม่ได้โหลด
        $invoiceItems = $invoice->items;
        
        \Log::info("🔍 getInvoiceItems - Retrieved items, count: " . ($invoiceItems ? $invoiceItems->count() : 'NULL'));

        if ($invoiceItems && $invoiceItems->count() > 0) {
            // ใช้ข้อมูลจาก invoice_items เท่านั้น
            $result = $invoiceItems->sortBy('sequence_order')->values()->toArray();
            \Log::info("🔍 getInvoiceItems - Returning " . count($result) . " items from invoice_items");
            return $result;
        }

        // ไม่ต้อง fallback ไปหา quotation->items
        // ถ้าไม่มี invoice_items ให้คืนค่า array ว่าง
        \Log::warning("⚠️ getInvoiceItems - No invoice_items found, returning empty array");
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
     * Override savePdfFile เพื่อใช้ logic เฉพาะของ Invoice
     */
    protected function savePdfFile(\Mpdf\Mpdf $mpdf, array $viewData): string
    {
        $invoice = $viewData['invoice'];
        $options = $viewData['options'] ?? [];
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
}