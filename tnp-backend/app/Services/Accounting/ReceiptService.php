<?php

namespace App\Services\Accounting;

use App\Models\Accounting\Receipt;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\DocumentAttachment;
use App\Services\Accounting\AutofillService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ReceiptService
{
    protected $autofillService;

    public function __construct(AutofillService $autofillService)
    {
        $this->autofillService = $autofillService;
    }

    /**
     * สร้าง Receipt จาก Payment
     */
    public function createFromPayment($invoiceId, $paymentData, $createdBy = null)
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            // ตรวจสอบสถานะ Invoice
            if (!in_array($invoice->status, ['sent', 'partial_paid'])) {
                throw new \Exception('Invoice must be sent or partially paid to create receipt');
            }

            // ดึงข้อมูล Auto-fill จาก Invoice
            $autofillData = $this->autofillService->getCascadeAutofillForReceipt($invoiceId);

            // สร้าง Receipt
            $receipt = new Receipt();
            $receipt->id = \Illuminate\Support\Str::uuid();
            $receipt->number = $this->generateReceiptNumber($paymentData['receipt_type'] ?? 'receipt');
            $receipt->invoice_id = $invoice->id;
            
            // Auto-fill ข้อมูลจาก Invoice
            $receipt->customer_id = $autofillData['customer_id'];
            $receipt->customer_company = $autofillData['customer_company'];
            $receipt->customer_tax_id = $autofillData['customer_tax_id'];
            $receipt->customer_address = $autofillData['customer_address'];
            $receipt->customer_zip_code = $autofillData['customer_zip_code'];
            $receipt->customer_tel_1 = $autofillData['customer_tel_1'];
            $receipt->customer_email = $autofillData['customer_email'];
            $receipt->customer_firstname = $autofillData['customer_firstname'];
            $receipt->customer_lastname = $autofillData['customer_lastname'];

            // ข้อมูลงาน
            $receipt->work_name = $autofillData['work_name'];
            $receipt->quantity = $autofillData['quantity'];

            // ข้อมูลการชำระ
            $receipt->payment_date = $paymentData['payment_date'] ?? now()->format('Y-m-d');
            $receipt->payment_method = $paymentData['payment_method'];
            $receipt->payment_amount = $paymentData['amount'];
            $receipt->payment_reference = $paymentData['reference_number'] ?? null;
            $receipt->bank_name = $paymentData['bank_name'] ?? null;

            // กำหนดประเภทใบเสร็จ
            $receiptType = $this->determineReceiptType($invoice, $paymentData);
            $receipt->receipt_type = $receiptType;

            // คำนวณ VAT และยอดเงิน
            $amounts = $this->calculateReceiptAmounts($paymentData['amount'], $receiptType);
            $receipt->subtotal = $amounts['subtotal'];
            $receipt->vat_rate = $amounts['vat_rate'];
            $receipt->vat_amount = $amounts['vat_amount'];
            $receipt->total_amount = $paymentData['amount'];

            // Generate Tax Invoice Number สำหรับใบกำกับภาษี
            if (in_array($receiptType, ['tax_invoice', 'full_tax_invoice'])) {
                $receipt->tax_invoice_number = $this->generateTaxInvoiceNumber();
            }

            $receipt->notes = $paymentData['notes'] ?? null;
            $receipt->status = 'draft';
            $receipt->created_by = $createdBy;
            $receipt->created_at = now();

            $receipt->save();

            // บันทึก History
            DocumentHistory::logAction(
                'receipt',
                $receipt->id,
                'create_from_payment',
                $createdBy,
                "สร้างใบเสร็จจากการชำระเงิน {$invoice->number} (จำนวน: ฿" . number_format($paymentData['amount'], 2) . ")"
            );

            DB::commit();

            return $receipt->load(['invoice']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ReceiptService::createFromPayment error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง Receipt แบบ Manual
     */
    public function create($receiptData, $createdBy = null)
    {
        try {
            DB::beginTransaction();

            $receipt = new Receipt();
            $receipt->id = \Illuminate\Support\Str::uuid();
            $receipt->number = $this->generateReceiptNumber($receiptData['receipt_type'] ?? 'receipt');
            
            // กรอกข้อมูลจาก input
            foreach ($receiptData as $key => $value) {
                if ($receipt->isFillable($key)) {
                    $receipt->$key = $value;
                }
            }

            // Generate Tax Invoice Number สำหรับใบกำกับภาษี
            if (in_array($receipt->receipt_type, ['tax_invoice', 'full_tax_invoice'])) {
                $receipt->tax_invoice_number = $this->generateTaxInvoiceNumber();
            }

            $receipt->status = 'draft';
            $receipt->created_by = $createdBy;
            $receipt->created_at = now();

            $receipt->save();

            // บันทึก History
            DocumentHistory::logAction(
                'receipt',
                $receipt->id,
                'create',
                $createdBy,
                "สร้างใบเสร็จใหม่"
            );

            DB::commit();

            return $receipt;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ReceiptService::create error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อัปเดต Receipt
     */
    public function update($receiptId, $updateData, $updatedBy = null)
    {
        try {
            DB::beginTransaction();

            $receipt = Receipt::findOrFail($receiptId);

            // ตรวจสอบสถานะ
            if (!in_array($receipt->status, ['draft', 'pending_review'])) {
                throw new \Exception('Receipt cannot be updated in current status');
            }

            $oldData = $receipt->toArray();

            // อัปเดตข้อมูล
            foreach ($updateData as $key => $value) {
                if ($receipt->isFillable($key)) {
                    $receipt->$key = $value;
                }
            }

            $receipt->updated_by = $updatedBy;
            $receipt->save();

            // บันทึก History การแก้ไข
            $changes = array_diff_assoc($receipt->toArray(), $oldData);
            if (!empty($changes)) {
                DocumentHistory::logAction(
                    'receipt',
                    $receiptId,
                    'update',
                    $updatedBy,
                    "แก้ไขใบเสร็จ: " . implode(', ', array_keys($changes))
                );
            }

            DB::commit();

            return $receipt->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ReceiptService::update error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ส่งใบเสร็จเพื่อขออนุมัติ
     */
    public function submit($receiptId, $submittedBy = null)
    {
        try {
            DB::beginTransaction();

            $receipt = Receipt::findOrFail($receiptId);

            if ($receipt->status !== 'draft') {
                throw new \Exception('Receipt must be in draft status to submit');
            }

            $receipt->status = 'pending_review';
            $receipt->submitted_by = $submittedBy;
            $receipt->submitted_at = now();
            $receipt->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'receipt',
                $receiptId,
                'draft',
                'pending_review',
                'ส่งขออนุมัติ',
                $submittedBy
            );

            DB::commit();

            return $receipt->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ReceiptService::submit error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อนุมัติใบเสร็จ (Account)
     */
    public function approve($receiptId, $approvedBy = null, $notes = null)
    {
        try {
            DB::beginTransaction();

            $receipt = Receipt::findOrFail($receiptId);

            if ($receipt->status !== 'pending_review') {
                throw new \Exception('Receipt must be pending review to approve');
            }

            $receipt->status = 'approved';
            $receipt->approved_by = $approvedBy;
            $receipt->approved_at = now();

            // Generate final tax invoice number ถ้าเป็นใบกำกับภาษี
            if (in_array($receipt->receipt_type, ['tax_invoice', 'full_tax_invoice']) && empty($receipt->tax_invoice_number)) {
                $receipt->tax_invoice_number = $this->generateTaxInvoiceNumber();
            }

            $receipt->save();

            // อัปเดตสถานะ Invoice เป็น fully_paid ถ้าชำระครบ
            if ($receipt->invoice_id) {
                $this->updateInvoicePaymentStatus($receipt->invoice_id, $receipt->payment_amount);
            }

            // บันทึก History
            DocumentHistory::logStatusChange(
                'receipt',
                $receiptId,
                'pending_review',
                'approved',
                'อนุมัติ',
                $approvedBy,
                $notes
            );

            DB::commit();

            return $receipt->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ReceiptService::approve error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ปฏิเสธใบเสร็จ
     */
    public function reject($receiptId, $reason, $rejectedBy = null)
    {
        try {
            DB::beginTransaction();

            $receipt = Receipt::findOrFail($receiptId);

            if ($receipt->status !== 'pending_review') {
                throw new \Exception('Receipt must be pending review to reject');
            }

            $receipt->status = 'rejected';
            $receipt->rejected_by = $rejectedBy;
            $receipt->rejected_at = now();
            $receipt->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'receipt',
                $receiptId,
                'pending_review',
                'rejected',
                'ปฏิเสธ',
                $rejectedBy,
                $reason
            );

            DB::commit();

            return $receipt->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ReceiptService::reject error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อัปโหลดหลักฐานการชำระ
     */
    public function uploadEvidence($receiptId, $files, $description = null, $uploadedBy = null)
    {
        try {
            DB::beginTransaction();

            $receipt = Receipt::findOrFail($receiptId);

            $uploadedFiles = [];

            foreach ($files as $file) {
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('receipts/evidence', $filename, 'public');

                // สร้าง attachment record
                $attachment = DocumentAttachment::create([
                    'document_type' => 'receipt',
                    'document_id' => $receiptId,
                    'filename' => $filename,
                    'original_filename' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                    'uploaded_by' => $uploadedBy
                ]);

                $uploadedFiles[] = [
                    'id' => $attachment->id,
                    'filename' => $filename,
                    'original_filename' => $file->getClientOriginalName(),
                    'url' => Storage::url($path),
                    'size' => $file->getSize()
                ];
            }

            // บันทึก History
            $fileCount = count($files);
            DocumentHistory::logAction(
                'receipt',
                $receiptId,
                'upload_evidence',
                $uploadedBy,
                "อัปโหลดหลักฐาน {$fileCount} ไฟล์" . ($description ? ": {$description}" : "")
            );

            DB::commit();

            return [
                'uploaded_files' => $uploadedFiles,
                'description' => $description,
                'uploaded_by' => $uploadedBy,
                'uploaded_at' => now()->format('Y-m-d\TH:i:s\Z')
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ReceiptService::uploadEvidence error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ดึงรายการ Receipt พร้อม Filter
     */
    public function getList($filters = [], $perPage = 20)
    {
        try {
            $query = Receipt::with(['invoice', 'documentHistory', 'documentAttachments'])
                          ->select('receipts.*');

            // Filters
            if (!empty($filters['search'])) {
                $search = $filters['search'];
                $query->where(function($q) use ($search) {
                    $q->where('number', 'like', "%{$search}%")
                      ->orWhere('customer_company', 'like', "%{$search}%")
                      ->orWhere('work_name', 'like', "%{$search}%")
                      ->orWhere('tax_invoice_number', 'like', "%{$search}%");
                });
            }

            if (!empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            if (!empty($filters['receipt_type'])) {
                $query->where('receipt_type', $filters['receipt_type']);
            }

            if (!empty($filters['customer_id'])) {
                $query->where('customer_id', $filters['customer_id']);
            }

            if (!empty($filters['payment_method'])) {
                $query->where('payment_method', $filters['payment_method']);
            }

            if (!empty($filters['date_from'])) {
                $query->whereDate('payment_date', '>=', $filters['date_from']);
            }

            if (!empty($filters['date_to'])) {
                $query->whereDate('payment_date', '<=', $filters['date_to']);
            }

            return $query->orderBy('created_at', 'desc')->paginate($perPage);

        } catch (\Exception $e) {
            Log::error('ReceiptService::getList error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง PDF ใบเสร็จ/ใบกำกับภาษี
     */
    public function generatePdf($receiptId)
    {
        try {
            $receipt = Receipt::with(['invoice'])->findOrFail($receiptId);

            if (!in_array($receipt->status, ['approved'])) {
                throw new \Exception('Receipt must be approved before generating PDF');
            }

            $filename = $this->generatePdfFilename($receipt);
            $pdfPath = storage_path("app/public/pdfs/receipts/{$filename}");

            // สร้าง directory ถ้าไม่มี
            $directory = dirname($pdfPath);
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            // TODO: Implement actual PDF generation
            $content = $this->generatePdfContent($receipt);
            file_put_contents($pdfPath, $content);

            $fileSize = filesize($pdfPath);
            $pdfUrl = url("storage/pdfs/receipts/{$filename}");

            // บันทึก History
            DocumentHistory::logAction(
                'receipt',
                $receiptId,
                'generate_pdf',
                auth()->user()->user_uuid ?? null,
                "สร้าง PDF: {$filename}"
            );

            return [
                'url' => $pdfUrl,
                'filename' => $filename,
                'size' => $fileSize,
                'path' => $pdfPath
            ];

        } catch (\Exception $e) {
            Log::error('ReceiptService::generatePdf error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * กำหนดประเภทใบเสร็จ
     */
    private function determineReceiptType($invoice, $paymentData)
    {
        // ถ้าระบุประเภทมาแล้ว
        if (!empty($paymentData['receipt_type'])) {
            return $paymentData['receipt_type'];
        }

        // ตรวจสอบตามเลขภาษีลูกค้า
        if ($invoice->customer_tax_id && strlen($invoice->customer_tax_id) === 13) {
            return 'tax_invoice'; // ใบกำกับภาษี
        }

        return 'receipt'; // ใบเสร็จธรรมดา
    }

    /**
     * คำนวณยอดเงินและ VAT
     */
    private function calculateReceiptAmounts($totalAmount, $receiptType)
    {
        if (in_array($receiptType, ['tax_invoice', 'full_tax_invoice'])) {
            // คำนวณ VAT 7% (ราคารวม VAT แล้ว)
            $vatRate = 0.07;
            $subtotal = $totalAmount / (1 + $vatRate);
            $vatAmount = $totalAmount - $subtotal;

            return [
                'subtotal' => round($subtotal, 2),
                'vat_rate' => $vatRate,
                'vat_amount' => round($vatAmount, 2)
            ];
        }

        // ใบเสร็จธรรมดา (ไม่มี VAT)
        return [
            'subtotal' => $totalAmount,
            'vat_rate' => 0,
            'vat_amount' => 0
        ];
    }

    /**
     * Generate Receipt Number
     */
    private function generateReceiptNumber($type = 'receipt')
    {
        $year = date('Y');
        $month = date('m');
        
        $prefixes = [
            'receipt' => 'RCPT',
            'tax_invoice' => 'TAX',
            'full_tax_invoice' => 'FTAX'
        ];
        
        $prefix = $prefixes[$type] ?? 'RCPT';
        $prefix .= $year . $month;
        
        $lastReceipt = Receipt::where('number', 'like', $prefix . '%')
                            ->orderBy('number', 'desc')
                            ->first();
        
        if ($lastReceipt) {
            $lastNumber = intval(substr($lastReceipt->number, -4));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . '-' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate Tax Invoice Number
     */
    private function generateTaxInvoiceNumber()
    {
        $year = date('Y') + 543; // Buddhist Year
        $prefix = 'AA12345678901'; // เลขประจำตัวผู้เสียภาษีของบริษัท
        
        $lastTaxInvoice = Receipt::whereNotNull('tax_invoice_number')
                               ->where('tax_invoice_number', 'like', $prefix . '-' . $year . '%')
                               ->orderBy('tax_invoice_number', 'desc')
                               ->first();
        
        if ($lastTaxInvoice) {
            $lastNumber = intval(substr($lastTaxInvoice->tax_invoice_number, -3));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . '-' . $year . '-' . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * อัปเดตสถานะการชำระของ Invoice
     */
    private function updateInvoicePaymentStatus($invoiceId, $paymentAmount)
    {
        $invoice = Invoice::findOrFail($invoiceId);
        
        $currentPaid = $invoice->paid_amount ?? 0;
        $newPaidAmount = $currentPaid + $paymentAmount;
        
        $invoice->paid_amount = $newPaidAmount;
        
        if ($newPaidAmount >= $invoice->total_amount) {
            $invoice->status = 'fully_paid';
            $invoice->paid_at = now();
        } else {
            $invoice->status = 'partial_paid';
        }
        
        $invoice->save();
    }

    /**
     * Generate PDF filename
     */
    private function generatePdfFilename($receipt)
    {
        $type = $receipt->receipt_type === 'tax_invoice' ? 'tax-invoice' : 'receipt';
        return "{$type}-{$receipt->number}.pdf";
    }

    /**
     * สร้างเนื้อหา PDF (placeholder)
     */
    private function generatePdfContent($receipt)
    {
        $title = $receipt->receipt_type === 'tax_invoice' ? 'ใบกำกับภาษี' : 'ใบเสร็จรับเงิน';
        
        return "
TNP GROUP
{$title} {$receipt->number}
" . ($receipt->tax_invoice_number ? "เลขที่กำกับภาษี: {$receipt->tax_invoice_number}" : "") . "

ลูกค้า: {$receipt->customer_company}
เลขภาษี: {$receipt->customer_tax_id}
ที่อยู่: {$receipt->customer_address}

รายละเอียดงาน:
{$receipt->work_name}
จำนวน: {$receipt->quantity}

การชำระเงิน:
วันที่ชำระ: {$receipt->payment_date}
วิธีการชำระ: {$receipt->payment_method}
เลขที่อ้างอิง: {$receipt->payment_reference}

ราคา:
ยอดก่อนภาษี: " . number_format($receipt->subtotal, 2) . " บาท
ภาษีมูลค่าเพิ่ม " . ($receipt->vat_rate * 100) . "%: " . number_format($receipt->vat_amount, 2) . " บาท
ยอดรวม: " . number_format($receipt->total_amount, 2) . " บาท

หมายเหตุ:
{$receipt->notes}

วันที่: " . now()->format('d/m/Y') . "
";
    }
}
