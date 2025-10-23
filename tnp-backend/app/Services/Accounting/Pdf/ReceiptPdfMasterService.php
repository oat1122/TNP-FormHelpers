<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\Invoice;
use Illuminate\Support\Facades\View;
use Mpdf\Mpdf;

/**
 * Master PDF Service สำหรับใบเสร็จรับเงิน (Receipt)
 * - ใช้ Body/Styles เดียวกับ Invoice แต่ Header ต่างกัน
 * - Footer และ Signature ใช้ partial ของ Invoice เดิม
 */
class ReceiptPdfMasterService extends InvoicePdfMasterService
{
    protected function getFilenamePrefix(): string
    {
        return 'receipt';
    }
    
    protected function getStorageFolder(): string
    {
        return 'receipts';
    }

    protected function addHeaderFooter(Mpdf $mpdf, array $data): void
    {
        $invoice  = $data['invoice'];
        $customer = $data['customer'];
        $isFinal  = $data['isFinal'];

        // Receipt Header (different from regular invoice)
        $summary = $data['summary'] ?? [];
        $headerHtml = View::make('accounting.pdf.receipt.partials.receipt-header', compact(
            'invoice', 'customer', 'isFinal', 'summary'
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
     * Override savePdfFile เพื่อใช้ชื่อไฟล์เฉพาะของ Receipt
     */
    protected function savePdfFile(\Mpdf\Mpdf $mpdf, array $viewData): string
    {
        $invoice = $viewData['invoice'];
        $options = $viewData['options'] ?? [];
        $timestamp = now()->format('Y-m-d-His');
        $headerType = $options['document_header_type'] ?? $invoice->document_header_type ?? 'ต้นฉบับ';
        $headerSlug = $this->slugHeaderType($headerType);
        $filename = sprintf('receipt-%s-%s-%s.pdf',
            $invoice->number ?? $invoice->id,
            $headerSlug,
            $timestamp
        );

        $directory = storage_path('app/public/pdfs/receipts');
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filePath = $directory . DIRECTORY_SEPARATOR . $filename;
        $mpdf->Output($filePath, 'F');

        return $filePath;
    }
}