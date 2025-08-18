<?php

namespace App\Services\Accounting;

use App\Models\Accounting\Invoice;
use App\Models\Accounting\Quotation;
use App\Models\Accounting\Receipt;
use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\DocumentAttachment;
use App\Services\Accounting\AutofillService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class InvoiceService
{
    protected $autofillService;

    public function __construct(AutofillService $autofillService)
    {
        $this->autofillService = $autofillService;
    }

    /**
     * One-Click Conversion จาก Quotation เป็น Invoice
     */
    public function createFromQuotation($quotationId, $invoiceData, $createdBy = null)
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($quotationId);

            // ตรวจสอบสถานะ Quotation
            if ($quotation->status !== 'approved') {
                throw new \Exception('Quotation must be approved before converting to invoice');
            }

            // ดึงข้อมูล Auto-fill จาก Quotation
            $autofillData = $this->autofillService->getCascadeAutofillForInvoice($quotationId);

            // สร้าง Invoice
            $invoice = new Invoice();
            $invoice->id = \Illuminate\Support\Str::uuid();
            $invoice->company_id = $quotation->company_id
                ?? (auth()->user()->company_id ?? optional(\App\Models\Company::where('is_active', true)->first())->id);
            $invoice->number = Invoice::generateInvoiceNumber($invoice->company_id);
            $invoice->quotation_id = $quotation->id;
            
            // Auto-fill ข้อมูลจาก Quotation
            $invoice->customer_id = $autofillData['customer_id'];
            $invoice->customer_company = $autofillData['customer_company'];
            $invoice->customer_tax_id = $autofillData['customer_tax_id'];
            $invoice->customer_address = $autofillData['customer_address'];
            $invoice->customer_zip_code = $autofillData['customer_zip_code'];
            $invoice->customer_tel_1 = $autofillData['customer_tel_1'];
            $invoice->customer_email = $autofillData['customer_email'];
            $invoice->customer_firstname = $autofillData['customer_firstname'];
            $invoice->customer_lastname = $autofillData['customer_lastname'];

            // ข้อมูลงาน
            $invoice->work_name = $autofillData['work_name'];
            $invoice->fabric_type = $autofillData['fabric_type'] ?? null;
            $invoice->pattern = $autofillData['pattern'] ?? null;
            $invoice->color = $autofillData['color'] ?? null;
            $invoice->sizes = $autofillData['sizes'] ?? null;
            $invoice->quantity = $autofillData['quantity'];
            $invoice->due_date = $autofillData['due_date'];

            // คำนวณยอดตามประเภท Invoice
            $invoiceType = $invoiceData['type'] ?? 'remaining';
            $amounts = $this->calculateInvoiceAmounts($quotation, $invoiceType, $invoiceData);
            
            $invoice->type = $invoiceType;
            $invoice->subtotal = $amounts['subtotal'];
            $invoice->tax_amount = $amounts['tax_amount'];
            $invoice->total_amount = $amounts['total_amount'];
            $invoice->payment_terms = $invoiceData['payment_terms'] ?? $autofillData['payment_terms'];
            
            // คำนวณวันครบกำหนดชำระ
            $invoice->due_date = $this->calculateDueDate($invoice->payment_terms);
            
            // ข้อมูลเพิ่มเติม
            $invoice->notes = $invoiceData['notes'] ?? null;
            $invoice->status = 'draft';
            $invoice->created_by = $createdBy;
            $invoice->created_at = now();

            $invoice->save();

            // บันทึก History
            DocumentHistory::logAction(
                'invoice',
                $invoice->id,
                'create_from_quotation',
                $createdBy,
                "สร้างใบแจ้งหนี้จากใบเสนอราคา {$quotation->number} (ประเภท: {$invoiceType})"
            );

            DB::commit();

            return $invoice->load(['quotation', 'customer']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::createFromQuotation error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง Invoice แบบ Manual
     */
    public function create($invoiceData, $createdBy = null)
    {
        try {
            DB::beginTransaction();

            $invoice = new Invoice();
            $invoice->id = \Illuminate\Support\Str::uuid();
            $invoice->company_id = $invoiceData['company_id']
                ?? (auth()->user()->company_id ?? optional(\App\Models\Company::where('is_active', true)->first())->id);
            $invoice->number = Invoice::generateInvoiceNumber($invoice->company_id);
            
            // กรอกข้อมูลจาก input
            foreach ($invoiceData as $key => $value) {
                if ($invoice->isFillable($key)) {
                    $invoice->$key = $value;
                }
            }

            $invoice->status = 'draft';
            $invoice->created_by = $createdBy;
            $invoice->created_at = now();

            $invoice->save();

            // บันทึก History
            DocumentHistory::logAction(
                'invoice',
                $invoice->id,
                'create',
                $createdBy,
                "สร้างใบแจ้งหนี้ใหม่"
            );

            DB::commit();

            return $invoice;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::create error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อัปเดต Invoice
     */
    public function update($invoiceId, $updateData, $updatedBy = null)
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            // ตรวจสอบสถานะ
            if (!in_array($invoice->status, ['draft', 'pending_review'])) {
                throw new \Exception('Invoice cannot be updated in current status');
            }

            $oldData = $invoice->toArray();

            // อัปเดตข้อมูล
            foreach ($updateData as $key => $value) {
                if ($invoice->isFillable($key)) {
                    $invoice->$key = $value;
                }
            }

            $invoice->updated_by = $updatedBy;
            $invoice->save();

            // บันทึก History การแก้ไข
            $changes = array_diff_assoc($invoice->toArray(), $oldData);
            if (!empty($changes)) {
                DocumentHistory::logAction(
                    'invoice',
                    $invoiceId,
                    'update',
                    $updatedBy,
                    "แก้ไขใบแจ้งหนี้: " . implode(', ', array_keys($changes))
                );
            }

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::update error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ส่งใบแจ้งหนี้เพื่อขออนุมัติ (Sales → Account)
     */
    public function submit($invoiceId, $submittedBy = null)
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if ($invoice->status !== 'draft') {
                throw new \Exception('Invoice must be in draft status to submit');
            }

            $invoice->status = 'pending_review';
            $invoice->submitted_by = $submittedBy;
            $invoice->submitted_at = now();
            $invoice->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                'draft',
                'pending_review',
                'ส่งขออนุมัติ',
                $submittedBy
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::submit error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อนุมัติใบแจ้งหนี้ (Account)
     */
    public function approve($invoiceId, $approvedBy = null, $notes = null)
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if ($invoice->status !== 'pending_review') {
                throw new \Exception('Invoice must be pending review to approve');
            }

            $invoice->status = 'approved';
            $invoice->approved_by = $approvedBy;
            $invoice->approved_at = now();
            $invoice->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                'pending_review',
                'approved',
                'อนุมัติ',
                $approvedBy,
                $notes
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::approve error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ปฏิเสธใบแจ้งหนี้ (Account)
     */
    public function reject($invoiceId, $reason, $rejectedBy = null)
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if ($invoice->status !== 'pending_review') {
                throw new \Exception('Invoice must be pending review to reject');
            }

            $invoice->status = 'rejected';
            $invoice->rejected_by = $rejectedBy;
            $invoice->rejected_at = now();
            $invoice->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                'pending_review',
                'rejected',
                'ปฏิเสธ',
                $rejectedBy,
                $reason
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::reject error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ส่งกลับแก้ไข (Account ส่งกลับให้ Sales)
     */
    public function sendBack($invoiceId, $reason, $actionBy = null)
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if ($invoice->status !== 'pending_review') {
                throw new \Exception('Invoice must be pending review to send back');
            }

            $invoice->status = 'draft';
            $invoice->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                'pending_review',
                'draft',
                'ส่งกลับแก้ไข',
                $actionBy,
                $reason
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::sendBack error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ส่งใบแจ้งหนี้ให้ลูกค้า
     */
    public function sendToCustomer($invoiceId, $sendData, $sentBy = null)
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if ($invoice->status !== 'approved') {
                throw new \Exception('Invoice must be approved before sending to customer');
            }

            $invoice->status = 'sent';
            $invoice->sent_by = $sentBy;
            $invoice->sent_at = now();
            $invoice->save();

            // บันทึก History
            $notes = "ส่งให้ลูกค้าด้วยวิธี: " . ($sendData['delivery_method'] ?? 'อีเมล');
            if (!empty($sendData['recipient_email'])) {
                $notes .= "\nส่งถึง: " . $sendData['recipient_email'];
            }

            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                'approved',
                'sent',
                'ส่งให้ลูกค้า',
                $sentBy,
                $notes
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::sendToCustomer error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * บันทึกการชำระเงิน
     */
    public function recordPayment($invoiceId, $paymentData, $recordedBy = null)
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if (!in_array($invoice->status, ['sent', 'partial_paid'])) {
                throw new \Exception('Invoice must be sent before recording payment');
            }

            $paymentAmount = $paymentData['amount'];
            $currentPaid = $invoice->paid_amount ?? 0;
            $newPaidAmount = $currentPaid + $paymentAmount;

            if ($newPaidAmount > $invoice->total_amount) {
                throw new \Exception('Payment amount cannot exceed invoice total');
            }

            $invoice->paid_amount = $newPaidAmount;
            
            // อัปเดตสถานะ
            if ($newPaidAmount >= $invoice->total_amount) {
                $invoice->status = 'fully_paid';
                $invoice->paid_at = now();
            } else {
                $invoice->status = 'partial_paid';
            }

            $invoice->save();

            // บันทึก History
            $notes = "ชำระเงิน: ฿" . number_format($paymentAmount, 2);
            if (!empty($paymentData['payment_method'])) {
                $notes .= "\nวิธีการชำระ: " . $paymentData['payment_method'];
            }
            if (!empty($paymentData['reference_number'])) {
                $notes .= "\nเลขที่อ้างอิง: " . $paymentData['reference_number'];
            }

            DocumentHistory::logAction(
                'invoice',
                $invoiceId,
                'record_payment',
                $recordedBy,
                $notes
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InvoiceService::recordPayment error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ดึงรายการ Invoice พร้อม Filter
     */
    public function getList($filters = [], $perPage = 20)
    {
        try {
            $query = Invoice::with(['quotation', 'documentHistory'])
                          ->select('invoices.*');

            // Filters
            if (!empty($filters['search'])) {
                $search = $filters['search'];
                $query->where(function($q) use ($search) {
                    $q->where('number', 'like', "%{$search}%")
                      ->orWhere('customer_company', 'like', "%{$search}%")
                      ->orWhere('work_name', 'like', "%{$search}%");
                });
            }

            if (!empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            if (!empty($filters['customer_id'])) {
                $query->where('customer_id', $filters['customer_id']);
            }

            if (!empty($filters['date_from'])) {
                $query->whereDate('created_at', '>=', $filters['date_from']);
            }

            if (!empty($filters['date_to'])) {
                $query->whereDate('created_at', '<=', $filters['date_to']);
            }

            if (!empty($filters['due_date_from'])) {
                $query->whereDate('due_date', '>=', $filters['due_date_from']);
            }

            if (!empty($filters['due_date_to'])) {
                $query->whereDate('due_date', '<=', $filters['due_date_to']);
            }

            if (!empty($filters['overdue'])) {
                $query->where('due_date', '<', now())
                      ->whereIn('status', ['sent', 'partial_paid']);
            }

            return $query->orderBy('created_at', 'desc')->paginate($perPage);

        } catch (\Exception $e) {
            Log::error('InvoiceService::getList error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง PDF ใบแจ้งหนี้
     */
    public function generatePdf($invoiceId)
    {
        try {
            $invoice = Invoice::with(['quotation', 'customer'])->findOrFail($invoiceId);

            if (!in_array($invoice->status, ['approved', 'sent', 'partial_paid', 'fully_paid'])) {
                throw new \Exception('Invoice must be approved before generating PDF');
            }

            $filename = "invoice-{$invoice->number}.pdf";
            $pdfPath = storage_path("app/public/pdfs/invoices/{$filename}");

            // สร้าง directory ถ้าไม่มี
            $directory = dirname($pdfPath);
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            // TODO: Implement actual PDF generation
            $content = $this->generatePdfContent($invoice);
            file_put_contents($pdfPath, $content);

            $fileSize = filesize($pdfPath);
            $pdfUrl = url("storage/pdfs/invoices/{$filename}");

            // บันทึก History
            DocumentHistory::logAction(
                'invoice',
                $invoiceId,
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
            Log::error('InvoiceService::generatePdf error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * คำนวณยอดเงินตามประเภท Invoice
     */
    private function calculateInvoiceAmounts($quotation, $type, $invoiceData = [])
    {
        switch ($type) {
            case 'full_amount':
                return [
                    'subtotal' => $quotation->subtotal,
                    'tax_amount' => $quotation->tax_amount,
                    'total_amount' => $quotation->total_amount
                ];

            case 'remaining':
                $totalAmount = $quotation->total_amount - ($quotation->deposit_amount ?? 0);
                $subtotal = $totalAmount / (1 + ($quotation->vat_rate ?? 0.07));
                $taxAmount = $totalAmount - $subtotal;
                
                return [
                    'subtotal' => round($subtotal, 2),
                    'tax_amount' => round($taxAmount, 2),
                    'total_amount' => $totalAmount
                ];

            case 'deposit':
                $totalAmount = $quotation->deposit_amount ?? 0;
                $subtotal = $totalAmount / (1 + ($quotation->vat_rate ?? 0.07));
                $taxAmount = $totalAmount - $subtotal;
                
                return [
                    'subtotal' => round($subtotal, 2),
                    'tax_amount' => round($taxAmount, 2),
                    'total_amount' => $totalAmount
                ];

            case 'partial':
                $totalAmount = $invoiceData['custom_amount'] ?? 0;
                $subtotal = $totalAmount / (1 + ($quotation->vat_rate ?? 0.07));
                $taxAmount = $totalAmount - $subtotal;
                
                return [
                    'subtotal' => round($subtotal, 2),
                    'tax_amount' => round($taxAmount, 2),
                    'total_amount' => $totalAmount
                ];

            default:
                throw new \Exception('Invalid invoice type');
        }
    }

    /**
     * คำนวณวันครบกำหนดชำระ
     */
    private function calculateDueDate($paymentTerms)
    {
        $days = 30; // Default 30 days

        if (preg_match('/(\d+)/', $paymentTerms, $matches)) {
            $days = intval($matches[1]);
        }

        return now()->addDays($days)->format('Y-m-d');
    }

    /**
     * สร้างเนื้อหา PDF (placeholder)
     */
    private function generatePdfContent($invoice)
    {
        return "
TNP GROUP
ใบแจ้งหนี้ {$invoice->number}

ลูกค้า: {$invoice->customer_company}
เลขภาษี: {$invoice->customer_tax_id}
ที่อยู่: {$invoice->customer_address}

รายละเอียดงาน:
{$invoice->work_name}
จำนวน: {$invoice->quantity}

ราคา:
ยอดก่อนภาษี: " . number_format($invoice->subtotal, 2) . " บาท
ภาษีมูลค่าเพิ่ม: " . number_format($invoice->tax_amount, 2) . " บาท
ยอดรวม: " . number_format($invoice->total_amount, 2) . " บาท

เงื่อนไขการชำระ: {$invoice->payment_terms}
วันครบกำหนด: {$invoice->due_date}

หมายเหตุ:
{$invoice->notes}

วันที่: " . now()->format('d/m/Y') . "
";
    }
}
