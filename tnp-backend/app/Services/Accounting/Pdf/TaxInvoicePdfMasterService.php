<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\Invoice;
use Illuminate\Support\Facades\View;
use Mpdf\Mpdf;

/**
 * Master PDF Service สำหรับใบกำกับภาษี (Tax Invoice)
 * - ใช้ Body/Styles เดียวกับ Invoice แต่ Header ต่างกัน
 * - Footer และ Signature ใช้ partial ของ Invoice เดิม
 */
class TaxInvoicePdfMasterService extends InvoicePdfMasterService
{
    protected function getFilenamePrefix(): string
    {
        return 'tax-invoice';
    }
    
    protected function getStorageFolder(): string
    {
        return 'tax-invoices';
    }

    /**
     * Override buildViewData to use tax_invoice document type for metadata
     */
    protected function buildViewData(object $invoice, array $options = []): array
    {
        // Get base data from parent (InvoicePdfMasterService)
        $data = parent::buildViewData($invoice, $options);
        
        // ✨ Override document metadata for tax invoice
        $metadata = $this->getDocumentMetadata($invoice, 'tax_invoice', $options);
        
        $data['docNumber'] = $metadata['docNumber'];      // e.g., TAXB202510-0001
        $data['referenceNo'] = $metadata['referenceNo'];  // Reference number
        $data['mode'] = $metadata['mode'];                // before/after/full
        
        \Log::info("🔍 TaxInvoicePDF buildViewData - Override metadata: " . json_encode($metadata));
        
        return $data;
    }

    protected function addHeaderFooter(Mpdf $mpdf, array $data): void
    {
        $invoice  = $data['invoice'];
        $customer = $data['customer'];
        $isFinal  = $data['isFinal'];

        // Tax Invoice Header (different from regular invoice)
        $summary = $data['summary'] ?? [];
        
        // ✨ Pass docNumber, referenceNo, mode to header view
        $docNumber = $data['docNumber'] ?? null;
        $referenceNo = $data['referenceNo'] ?? null;
        $mode = $data['mode'] ?? null;
        $options = $data['options'] ?? [];
        
        $headerHtml = View::make('accounting.pdf.tax-invoice.partials.tax-header', compact(
            'invoice', 'customer', 'isFinal', 'summary', 'docNumber', 'referenceNo', 'mode', 'options'
        ))->render();

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

        // ไม่ต้องแสดง Watermark
    }

    /**
     * Override savePdfFile เพื่อใช้ชื่อไฟล์เฉพาะของ Tax Invoice
     */
    protected function savePdfFile(\Mpdf\Mpdf $mpdf, array $viewData): string
    {
        $invoice = $viewData['invoice'];
        $options = $viewData['options'] ?? [];
        $timestamp = now()->format('Y-m-d-His');
        $headerType = $options['document_header_type'] ?? $invoice->document_header_type ?? 'ต้นฉบับ';
        $headerSlug = $this->slugHeaderType($headerType);
        $filename = sprintf('tax-invoice-%s-%s-%s.pdf',
            $invoice->number ?? $invoice->id,
            $headerSlug,
            $timestamp
        );

        $directory = storage_path('app/public/pdfs/tax-invoices');
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filePath = $directory . DIRECTORY_SEPARATOR . $filename;
        $mpdf->Output($filePath, 'F');

        return $filePath;
    }
}