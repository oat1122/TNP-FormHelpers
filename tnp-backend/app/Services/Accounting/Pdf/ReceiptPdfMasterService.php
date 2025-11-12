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

    /**
     * Override buildViewData to use receipt document type for metadata
     */
    protected function buildViewData(object $invoice, array $options = []): array
    {
        // Get base data from parent (InvoicePdfMasterService)
        $data = parent::buildViewData($invoice, $options);
        
        // ✨ Override document metadata for receipt
        $metadata = $this->getDocumentMetadata($invoice, 'receipt', $options);
        
        $data['docNumber'] = $metadata['docNumber'];      // e.g., RECB202510-0001
        $data['referenceNo'] = $metadata['referenceNo'];  // Reference number
        $data['mode'] = $metadata['mode'];                // before/after/full
        
        \Log::info("🔍 ReceiptPDF buildViewData - Override metadata: " . json_encode($metadata));
        
        return $data;
    }

    protected function addHeaderFooter(Mpdf $mpdf, array $data): void
    {
        $invoice  = $data['invoice'];
        $customer = $data['customer'];
        $isFinal  = $data['isFinal'];

        // Receipt Header (different from regular invoice)
        $summary = $data['summary'] ?? [];
        
        // ✨ Pass docNumber, referenceNo, mode to header view
        $docNumber = $data['docNumber'] ?? null;
        $referenceNo = $data['referenceNo'] ?? null;
        $mode = $data['mode'] ?? null;
        $options = $data['options'] ?? [];
        
        $headerHtml = View::make('accounting.pdf.receipt.partials.receipt-header', compact(
            'invoice', 'customer', 'isFinal', 'summary', 'docNumber', 'referenceNo', 'mode', 'options'
        ))->render();

        // Footer (single version without signature - signature will be rendered via adaptive placement)
        $footerHtml = View::make('accounting.pdf.invoice.partials.invoice-footer', compact(
            'invoice', 'customer', 'isFinal'
        ))->render();

        // Set the header and footer in Mpdf
        $mpdf->SetHTMLHeader($headerHtml);
        $mpdf->SetHTMLFooter($footerHtml); // ✨ คืนค่า: แสดงเลขหน้าในทุกหน้า

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