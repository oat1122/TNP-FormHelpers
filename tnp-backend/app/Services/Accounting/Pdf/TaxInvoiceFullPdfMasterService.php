<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\Invoice;
use Illuminate\Support\Facades\View;
use Mpdf\Mpdf;
use App\Services\Accounting\Pdf\CustomerInfoExtractor;

/**
 * Master PDF Service สำหรับใบกำกับภาษี (100% - ใช้ Body แบบ Quotation)
 */
class TaxInvoiceFullPdfMasterService extends InvoicePdfMasterService
{
    protected function getFilenamePrefix(): string
    {
        return 'tax-invoice-full';
    }

    protected function getStorageFolder(): string
    {
        return 'tax-invoices';
    }

    protected function getTemplatePath(array $viewData): string
    {
        // ใช้ template body ของ quotation ตาม Requirement
        return 'accounting.pdf.quotation.quotation-master';
    }

    protected function cssFiles(): array
    {
        // รวม CSS ที่จำเป็น: base, quotation body, และ header (ใช้ของ tax invoice)
        return [
            resource_path('views/accounting/pdf/shared/pdf-shared-base.css'),
            resource_path('views/accounting/pdf/quotation/quotation-master.css'),
            resource_path('views/pdf/partials/invoice-header.css'),
        ];
    }

    /**
     * Override addHeaderFooter เพื่อใช้ Header ของ Tax Invoice
     * และ Footer/Signature ของ Invoice (จาก Parent Class)
     */
    protected function addHeaderFooter(Mpdf $mpdf, array $data): void
    {
        $invoice  = $data['invoice'];
        $customer = $data['customer'];
        $isFinal  = $data['isFinal'];
        $summary = $data['summary'] ?? [];

        // ✨ Pass docNumber, referenceNo, mode to header view
        $docNumber = $data['docNumber'] ?? null;
        $referenceNo = $data['referenceNo'] ?? null;
        $mode = $data['mode'] ?? 'full';
        $options = $data['options'] ?? [];

        // **** ใช้ Header ของ Tax Invoice ****
        $headerHtml = View::make('accounting.pdf.tax-invoice.partials.tax-header', compact(
            'invoice', 'customer', 'isFinal', 'summary', 'docNumber', 'referenceNo', 'mode', 'options'
        ))->render();

        // **** ใช้ Footer/Signature Logic จาก InvoicePdfMasterService (Parent) ****
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
        $mpdf->SetHTMLFooter($footerHtml);
        $mpdf->SetHTMLFooter($lastPageFooterHtml, 'L');

        // ไม่ต้องแสดง Watermark
    }

    /**
     * Override buildViewData เพื่อเตรียมข้อมูลให้เข้ากับ quotation-master.blade.php
     * สำหรับใบกำกับภาษี (100%) ไม่ต้องแสดงรูปภาพตัวอย่าง
     */
    protected function buildViewData(object $invoiceModel, array $options = []): array
    {
        /** @var Invoice $invoice */
        $invoice = $invoiceModel->loadMissing(['company', 'customer', 'quotation', 'quotation.items', 'items', 'creator', 'manager']);

        // Allow runtime override of document header type
        if (!empty($options['document_header_type'])) {
            $invoice->document_header_type = $options['document_header_type'];
        }

        // ✨ Force 'full' mode for 100% tax invoice
        $options['deposit_mode'] = 'full';

        $customer = CustomerInfoExtractor::fromInvoice($invoice);
        // **** ใช้ Logic การ Group Items ให้เหมือน Quotation ****
        $groups = $this->groupItemsForQuotationTemplate($invoice);
        // **** สร้าง Summary ที่อาจจะต้องใช้ใน Header ****
        $summary = $this->buildFinancialSummary($invoice);

        $isFinal = in_array($invoice->status, ['approved', 'sent', 'completed', 'partial_paid', 'fully_paid'], true);

        // ✨ Get document metadata for TAXF (full mode)
        $metadata = $this->getDocumentMetadata($invoice, 'tax_invoice', $options);

        // **** ใช้ Clone ของ invoice และเคลียร์ sample_images ****
        $invoiceForView = clone $invoice;
        $invoiceForView->sample_images = []; // ไม่แสดงรูปภาพตัวอย่างในเอกสารทางการ

        \Log::info("🔍 TaxInvoiceFullPDF buildViewData - Full mode metadata: " . json_encode($metadata));

        // **** Key หลักของ Array ต้องตรงกับที่ quotation-master.blade.php คาดหวัง ****
        return [
            'quotation' => $invoiceForView, // ใช้ตัวที่เคลียร์ sample_images แล้ว
            'invoice' => $invoice,
            'customer' => $customer,
            'groups' => $groups,
            'summary' => $summary,
            'isFinal' => $isFinal,
            'docNumber' => $metadata['docNumber'],      // ✨ NEW: TAXF202510-0001
            'referenceNo' => $metadata['referenceNo'],  // ✨ NEW: Quotation number for full mode
            'mode' => $metadata['mode'],                // ✨ NEW: 'full'
            'options' => array_merge([
                'format' => 'A4',
                'orientation' => 'P',
                'showPageNumbers' => true,
                'showWatermark' => !$isFinal,
                'deposit_mode' => 'full',
            ], $options),
        ];
    }

    /**
     * Helper function to group invoice items similarly to QuotationPdfMasterService.
     * Adapt based on how `quotation-master.blade.php` expects the 'groups' data.
     */
    protected function groupItemsForQuotationTemplate(Invoice $invoice): array
    {
        // Use the item grouping logic from InvoicePdfMasterService as a base
        $groupedByProperties = $this->groupInvoiceItems($invoice);

        // Re-map the structure if `quotation-master.blade.php` expects something different.
        $finalGroups = [];
        foreach ($groupedByProperties as $group) {
            $finalGroups[] = [
                'name' => $group['name'] ?? 'ไม่ระบุชื่องาน',
                'pattern' => $group['pattern'] ?? null,
                'fabric' => $group['fabric'] ?? null,
                'color' => $group['color'] ?? null,
                'unit' => $group['unit'] ?? 'ชิ้น',
                'rows' => $group['rows'] ?? [],
            ];
        }
        return $finalGroups;
    }

    /**
     * Override savePdfFile เพื่อใช้ Prefix และ Folder ที่ถูกต้อง
     */
    protected function savePdfFile(\Mpdf\Mpdf $mpdf, array $viewData): string
    {
        $invoice = $viewData['invoice'];
        $options = $viewData['options'] ?? [];
        $timestamp = now()->format('Y-m-d-His');
        // ใช้ header type จาก options หรือจาก invoice
        $headerType = $options['document_header_type'] ?? $invoice->document_header_type ?? 'ต้นฉบับ';
        $headerSlug = $this->slugHeaderType($headerType);

        // ใช้ Prefix และ Folder ที่กำหนดใน Service นี้
        $filename = sprintf('%s-%s-%s-%s.pdf',
            $this->getFilenamePrefix(),
            $invoice->number ?? $invoice->id,
            $headerSlug,
            $timestamp
        );

        $directory = storage_path('app/public/pdfs/' . $this->getStorageFolder());
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filePath = $directory . DIRECTORY_SEPARATOR . $filename;
        $mpdf->Output($filePath, 'F');

        return $filePath;
    }
}
