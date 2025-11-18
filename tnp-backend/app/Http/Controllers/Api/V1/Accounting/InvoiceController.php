<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Services\Accounting\Pdf\TaxInvoicePdfMasterService;
use App\Services\Accounting\Pdf\ReceiptPdfMasterService;
use App\Services\Accounting\Pdf\TaxInvoiceFullPdfMasterService;
use App\Services\Accounting\Pdf\ReceiptFullPdfMasterService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Traits\ApiResponseHelper;
use App\Traits\HandlesPdfGeneration;
use App\Helpers\AccountingHelper;
use App\Http\Requests\V1\Accounting\StoreInvoiceRequest;
use App\Http\Requests\V1\Accounting\UpdateInvoiceRequest;
use App\Http\Requests\V1\Accounting\CreateFromQuotationRequest;
use App\Http\Requests\V1\Accounting\RecordPaymentRequest;
use App\Http\Requests\V1\Accounting\ApproveInvoiceRequest;
use App\Http\Requests\V1\Accounting\RejectInvoiceRequest;
use App\Http\Requests\V1\Accounting\SendToCustomerRequest;
use App\Http\Requests\V1\Accounting\SendReminderRequest;
use App\Http\Requests\V1\Accounting\UpdateDepositModeRequest;
use App\Http\Requests\V1\Accounting\SubmitAfterDepositRequest;
use App\Http\Requests\V1\Accounting\RevertToDraftRequest;
use App\Http\Requests\V1\Accounting\UploadEvidenceRequest;
use App\Http\Requests\V1\Accounting\UploadEvidenceByModeRequest;

class InvoiceController extends Controller
{
    use ApiResponseHelper, HandlesPdfGeneration;

    protected $invoiceService;

    public function __construct(InvoiceService $invoiceService)
    {
        $this->invoiceService = $invoiceService;
        // Require authentication for all invoice endpoints so auth()->user() is populated
        // and controller-level role checks function correctly.
        $this->middleware('auth:sanctum');
    }

    /**
     * อัปโหลดหลักฐานการชำระ / หลักฐานอื่นๆ ของ Invoice
     * POST /api/v1/invoices/{id}/upload-evidence
     */
    public function uploadEvidence(UploadEvidenceRequest $request, $id): JsonResponse
    {
        $data = $request->validated();
        $uploadedBy = AccountingHelper::getCurrentUserId();
        $result = $this->invoiceService->uploadEvidence($id, $request->file('files'), $data['description'] ?? null, $uploadedBy);

        return $this->successResponse($result, 'Evidence uploaded successfully');
    }

    /**
     * GET /api/v1/invoices/quotations-awaiting
     * List quotations that are signed and approved, with no invoice yet
     */
    public function quotationsAwaiting(Request $request): JsonResponse
    {
        $filters = ['search' => $request->query('search')];
        $perPage = min($request->query('per_page', 20), 50);
        $data = $this->invoiceService->getQuotationsAwaiting($filters, $perPage);

        return $this->successResponse($data, 'Quotations awaiting invoice retrieved successfully');
    }

    /**
     * ดึงรายการ Invoice พร้อม Filter
     * GET /api/v1/invoices
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [
            'search' => $request->query('search'),
            'type' => $request->query('type'),
            'customer_id' => $request->query('customer_id'),
            'date_from' => $request->query('date_from'),
            'date_to' => $request->query('date_to'),
            'due_date_from' => $request->query('due_date_from'),
            'due_date_to' => $request->query('due_date_to'),
            'overdue' => $request->query('overdue'),
            'status' => $request->query('status') 
                ? ['invoices.status', '=', $request->query('status')] 
                : null,
            'status_before' => $request->query('status_before') 
                ? ['invoices.status_before', '=', $request->query('status_before')] 
                : null,
            'status_after' => $request->query('status_after') 
                ? ['invoices.status_after', '=', $request->query('status_after')] 
                : null,
        ];

        $filters = array_filter($filters, fn($value) => !is_null($value));
        $perPage = min($request->query('per_page', 20), 100);
        
        $invoices = $this->invoiceService->getList($filters, $perPage);
        return $this->successResponse($invoices, 'Invoices retrieved successfully');
    }

    /**
     * ดูรายละเอียด Invoice
     * GET /api/v1/invoices/{id}
     */
    public function show($id): JsonResponse
    {
        $invoice = \App\Models\Accounting\Invoice::with([
            'quotation', 'documentHistory', 'attachments', 'items',
            'customer', 'manager', 'company', 'referenceInvoice', 'afterDepositInvoices'
        ])->findOrFail($id);

        return $this->successResponse($invoice, 'Invoice details retrieved successfully');
    }

    /**
     * สร้าง Invoice แบบ Manual
     * POST /api/v1/invoices
     */
    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        $data = $request->validated();
        $createdBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->create($data, $createdBy);

        return $this->createdResponse($invoice, 'Invoice created successfully');
    }

    /**
     * แก้ไข Invoice
     * PUT /api/v1/invoices/{id}
     */
    public function update(UpdateInvoiceRequest $request, $id): JsonResponse
    {
        $data = $request->validated();
        $updatedBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->update($id, $data, $updatedBy);

        return $this->successResponse($invoice, 'Invoice updated successfully');
    }

    /**
     * ลบ Invoice
     * DELETE /api/v1/invoices/{id}
     */
    public function destroy($id): JsonResponse
    {
        $invoice = \App\Models\Accounting\Invoice::findOrFail($id);

        if ($invoice->status !== 'draft') {
            return $this->errorResponse('Only draft invoices can be deleted', 400);
        }

        $invoice->delete();
        return $this->successResponse(null, 'Invoice deleted successfully');
    }

    /**
     * One-Click Conversion จาก Quotation เป็น Invoice
     * POST /api/v1/invoices/create-from-quotation
     */
    public function createFromQuotation(CreateFromQuotationRequest $request): JsonResponse
    {
        $data = $request->validated();
        $createdBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->createFromQuotation($data['quotation_id'], $data, $createdBy);

        return $this->createdResponse($invoice, 'Invoice created from quotation successfully');
    }

    /**
     * ส่งใบแจ้งหนี้เพื่อขออนุมัติฝั่ง Before Deposit (Sales → Account)
     * POST /api/v1/invoices/{id}/submit
     */
    public function submitBefore($id): JsonResponse
    {
        $submittedBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->submitBefore($id, $submittedBy);
        $data = $this->invoiceService->getInvoiceWithUiStatus($invoice);

        return $this->successResponse($data, 'Invoice submitted for approval (before deposit) successfully');
    }

    /**
     * อนุมัติใบแจ้งหนี้ฝั่ง Before Deposit
     * POST /api/v1/invoices/{id}/approve
     */
    public function approveBefore(ApproveInvoiceRequest $request, $id): JsonResponse
    {
        if (!AccountingHelper::hasRole(['admin', 'account'])) {
            return $this->forbiddenResponse('Only admin/account can approve invoices');
        }

        $data = $request->validated();
        $approvedBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->approveBefore($id, $approvedBy, $data['notes'] ?? null);
        $result = $this->invoiceService->getInvoiceWithUiStatus($invoice);

        return $this->successResponse($result, 'Invoice approved (before deposit) successfully');
    }

    /**
     * ปฏิเสธใบแจ้งหนี้
     * POST /api/v1/invoices/{id}/reject
     */
    public function reject(RejectInvoiceRequest $request, $id): JsonResponse
    {
        $data = $request->validated();
        $rejectedBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->reject($id, $data['reason'], $rejectedBy);

        return $this->successResponse($invoice, 'Invoice rejected successfully');
    }

    /**
     * ส่งขออนุมัติฝั่ง After Deposit
     * POST /api/v1/invoices/{id}/submit-after-deposit
     */
    public function submitAfter(SubmitAfterDepositRequest $request, $id): JsonResponse
    {
        if (!AccountingHelper::hasRole(['admin', 'account'])) {
            return $this->forbiddenResponse('Only admin/account can submit after-deposit');
        }

        $data = $request->validated();
        $submittedBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->submitAfter($id, $submittedBy);
        $result = $this->invoiceService->getInvoiceWithUiStatus($invoice);

        return $this->successResponse($result, 'Invoice submitted for after-deposit approval successfully');
    }

    /**
     * อนุมัติฝั่ง After Deposit
     * POST /api/v1/invoices/{id}/approve-after-deposit
     */
    public function approveAfter(ApproveInvoiceRequest $request, $id): JsonResponse
    {
        if (!AccountingHelper::hasRole(['admin', 'account'])) {
            return $this->forbiddenResponse('Only admin/account can approve after-deposit');
        }

        $data = $request->validated();
        $approvedBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->approveAfter($id, $approvedBy, $data['notes'] ?? null);
        $result = $this->invoiceService->getInvoiceWithUiStatus($invoice);

        return $this->successResponse($result, 'Invoice after-deposit approved successfully');
    }

    /**
     * ส่งกลับแก้ไข
     * POST /api/v1/invoices/{id}/send-back
     */
    public function sendBack(RejectInvoiceRequest $request, $id): JsonResponse
    {
        $data = $request->validated();
        $actionBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->sendBack($id, $data['reason'], $actionBy);

        return $this->successResponse($invoice, 'Invoice sent back for editing successfully');
    }

    /**
     * ย้อนสถานะใบแจ้งหนี้กลับเป็น draft
     * POST /api/v1/invoices/{id}/revert-to-draft
     */
    public function revertToDraft(RevertToDraftRequest $request, $id): JsonResponse
    {
        if (!AccountingHelper::hasRole(['admin', 'account'])) {
            return $this->forbiddenResponse('Only admin/account can revert invoice status');
        }

        $data = $request->validated();
        $revertedBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->revertToDraft($id, $data['side'] ?? null, $revertedBy, $data['reason'] ?? null);
        $result = $this->invoiceService->getInvoiceWithUiStatus($invoice);

        return $this->successResponse($result, 'Invoice status reverted to draft successfully');
    }

    /**
     * ส่งใบแจ้งหนี้ให้ลูกค้า
     * POST /api/v1/invoices/{id}/send-to-customer
     */
    public function sendToCustomer(SendToCustomerRequest $request, $id): JsonResponse
    {
        $data = $request->validated();
        $sentBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->sendToCustomer($id, $data, $sentBy);

        return $this->successResponse($invoice, 'Invoice sent to customer successfully');
    }

    /**
     * บันทึกการชำระเงิน
     * POST /api/v1/invoices/{id}/record-payment
     */
    public function recordPayment(RecordPaymentRequest $request, $id): JsonResponse
    {
        $data = $request->validated();
        $recordedBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->recordPayment($id, $data, $recordedBy);

        return $this->successResponse($invoice, 'Payment recorded successfully');
    }

    /**
     * ปรับการแสดงผลลำดับมัดจำ (presentation only)
     * PATCH /api/v1/invoices/{id}/deposit-display-order
     */
    public function updateDepositDisplayOrder(UpdateDepositModeRequest $request, $id): JsonResponse
    {
        $data = $request->validated();
        $updatedBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->updateDepositDisplayOrder($id, $data['deposit_display_order'], $updatedBy);

        return $this->successResponse($invoice, 'Deposit display order updated');
    }

    /**
     * อัปโหลดหลักฐานการชำระ / หลักฐานอื่นๆ ของ Invoice (mode-specific)
     * POST /api/v1/invoices/{id}/evidence/{mode}
     */
    public function uploadEvidenceByMode(UploadEvidenceByModeRequest $request, $id, $mode): JsonResponse
    {
        $data = $request->validated();
        $uploadedBy = AccountingHelper::getCurrentUserId();
        $result = $this->invoiceService->uploadEvidenceByMode($id, $request->file('files'), $mode, $data['description'] ?? null, $uploadedBy);

        return $this->successResponse($result, "Evidence uploaded successfully for {$mode} mode");
    }

    /**
     * สร้าง PDF ใบแจ้งหนี้
     * GET /api/v1/invoices/{id}/generate-pdf
     */
    public function generatePdf(Request $request, $id): JsonResponse
    {
        $options = $this->extractPdfOptions($request);
        $headerTypes = $request->input('headerTypes');
        
        $result = $this->invoiceService->generatePdfBundle(
            $id,
            is_array($headerTypes) ? $headerTypes : [],
            $options
        );

        $message = ($result['mode'] ?? 'single') === 'zip' 
            ? "สร้าง ZIP รวม {$result['count']} ไฟล์ PDF สำเร็จ"
            : 'PDF สร้างด้วย mPDF สำเร็จ';

        return $this->successResponse($result, $message);
    }

    /**
     * แสดง PDF ในเบราว์เซอร์ (ใช้ mPDF) - รองรับ mode parameter
     */
    public function streamPdf(Request $request, $id)
    {
        $invoice = \App\Models\Accounting\Invoice::findOrFail($id);
        $options = $this->extractPdfOptions($request);
        $options['deposit_mode'] = $this->extractDepositMode($request, $invoice);
        
        return $this->invoiceService->streamPdf($id, $options);
    }

    /**
     * ดาวน์โหลด PDF (alias ของ streamPdf แต่ force download) - รองรับ mode parameter
     */
    public function downloadPdf(Request $request, $id)
    {
        $invoice = \App\Models\Accounting\Invoice::with([
            'items', 'quotation', 'quotation.items', 'customer', 'company', 
            'creator', 'manager', 'referenceInvoice'
        ])->findOrFail($id);
        
        $options = $this->extractPdfOptions($request);
        $options['deposit_mode'] = $this->extractDepositMode($request, $invoice);
        $headerTypes = $request->input('headerTypes');

        // Single header: use service method directly
        if (empty($headerTypes) || !is_array($headerTypes)) {
            return $this->downloadPdfResponse($this->invoiceService, $invoice, $options, 'invoice');
        }

        // Multi-header: use trait method for ZIP generation
        $pdfService = app(\App\Services\Accounting\Pdf\InvoicePdfMasterService::class);
        return $this->generateMultiHeaderPdfWithZip($pdfService, $invoice, $headerTypes, $options, 'invoice');
    }

    /**
     * แสดง PDF ใบกำกับภาษี (Tax Invoice) ในเบราว์เซอร์ตาม mode
     * GET /api/v1/invoices/{id}/pdf/tax/preview?mode=before|after
     */
    public function streamTaxPdf(Request $request, $id)
    {
        $invoice = \App\Models\Accounting\Invoice::findOrFail($id);
        $options = $this->extractPdfOptions($request);
        $options['deposit_mode'] = $this->extractDepositMode($request, $invoice);
        $service = app(TaxInvoicePdfMasterService::class);
        
        return $this->streamPdfResponse($service, $invoice, $options);
    }

    /**
     * ดาวน์โหลด PDF ใบกำกับภาษี (Tax Invoice) - รองรับหลายหัวกระดาษ (zip)
     * POST /api/v1/invoices/{id}/pdf/tax/download
     */
    public function downloadTaxPdf(Request $request, $id)
    {
        $invoice = \App\Models\Accounting\Invoice::with([
            'items', 'quotation', 'quotation.items', 'customer', 'company',
            'creator', 'manager', 'referenceInvoice'
        ])->findOrFail($id);
        
        $options = $this->extractPdfOptions($request);
        $options['deposit_mode'] = $this->extractDepositMode($request, $invoice);
        $headerTypes = $request->input('headerTypes');
        $pdfService = app(TaxInvoicePdfMasterService::class);

        // Single header: direct download
        if (empty($headerTypes) || !is_array($headerTypes)) {
            return $this->downloadPdfResponse($pdfService, $invoice, $options, 'tax-invoice');
        }

        // Multi-header: use trait method for ZIP generation
        return $this->generateMultiHeaderPdfWithZip($pdfService, $invoice, $headerTypes, $options, 'tax-invoice');
    }

    /**
     * แสดง PDF ใบเสร็จรับเงิน (Receipt) ในเบราว์เซอร์ตาม mode
     * GET /api/v1/invoices/{id}/pdf/receipt/preview?mode=before|after
     */
    public function streamReceiptPdf(Request $request, $id)
    {
        $invoice = \App\Models\Accounting\Invoice::findOrFail($id);
        $options = $this->extractPdfOptions($request);
        $options['deposit_mode'] = $this->extractDepositMode($request, $invoice);
        $service = app(ReceiptPdfMasterService::class);
        
        return $this->streamPdfResponse($service, $invoice, $options);
    }

    /**
     * ดาวน์โหลด PDF ใบเสร็จรับเงิน (Receipt) - รองรับหลายหัวกระดาษ (zip)
     * POST /api/v1/invoices/{id}/pdf/receipt/download
     */
    public function downloadReceiptPdf(Request $request, $id)
    {
        $invoice = \App\Models\Accounting\Invoice::with([
            'items', 'quotation', 'quotation.items', 'customer', 'company',
            'creator', 'manager', 'referenceInvoice'
        ])->findOrFail($id);
        
        $options = $this->extractPdfOptions($request);
        $options['deposit_mode'] = $this->extractDepositMode($request, $invoice);
        $headerTypes = $request->input('headerTypes');
        $pdfService = app(ReceiptPdfMasterService::class);

        // Single header: direct download
        if (empty($headerTypes) || !is_array($headerTypes)) {
            return $this->downloadPdfResponse($pdfService, $invoice, $options, 'receipt');
        }

        // Multi-header: use trait method for ZIP generation
        return $this->generateMultiHeaderPdfWithZip($pdfService, $invoice, $headerTypes, $options, 'receipt');
    }

    /**
     * ตรวจสอบสถานะระบบ PDF
     */
    public function checkPdfStatus(): JsonResponse
    {
        return $this->checkPdfSystemStatusResponse($this->invoiceService);
    }

    /**
     * ดูประวัติการชำระเงิน
     * GET /api/v1/invoices/{id}/payment-history
     */
    public function getPaymentHistory($id): JsonResponse
    {
        $invoice = \App\Models\Accounting\Invoice::with([
            'documentHistory' => function($query) {
                $query->where('action_type', 'record_payment')->orderBy('created_at', 'desc');
            }
        ])->findOrFail($id);

        $paymentHistory = $invoice->documentHistory->map(function($history) {
            return [
                'id' => $history->id,
                'amount' => $this->extractAmountFromNotes($history->notes),
                'payment_method' => $this->extractPaymentMethodFromNotes($history->notes),
                'reference_number' => $this->extractReferenceFromNotes($history->notes),
                'recorded_by' => $history->action_by,
                'recorded_at' => $history->created_at,
                'notes' => $history->notes
            ];
        });

        $data = [
            'invoice_id' => $invoice->id,
            'invoice_number' => $invoice->number,
            'total_amount' => $invoice->total_amount,
            'paid_amount' => $invoice->paid_amount ?? 0,
            'remaining_amount' => $invoice->remaining_amount,
            'payment_history' => $paymentHistory
        ];

        return $this->successResponse($data, 'Payment history retrieved successfully');
    }

    /**
     * ส่งการแจ้งเตือนการชำระ
     * POST /api/v1/invoices/{id}/send-reminder
     */
    public function sendReminder(SendReminderRequest $request, $id): JsonResponse
    {
        $data = $request->validated();
        $invoice = \App\Models\Accounting\Invoice::findOrFail($id);

        if (!in_array($invoice->status, ['sent', 'partial_paid'])) {
            return $this->errorResponse('Reminder can only be sent for invoices that are sent or partially paid', 400);
        }

        // TODO: Implement actual reminder sending logic

        $actionBy = AccountingHelper::getCurrentUserId();
        \App\Models\Accounting\DocumentHistory::logAction(
            'invoice',
            $id,
            'send_reminder',
            $actionBy,
            "ส่งการแจ้งเตือน: " . ($data['notes'] ?? '')
        );

        return $this->successResponse(null, 'Payment reminder sent successfully');
    }

    /**
     * Helper functions สำหรับ extract ข้อมูลจาก notes
     */
    private function extractAmountFromNotes($notes)
    {
        if (preg_match('/ชำระเงิน: ฿([\d,]+\.?\d*)/', $notes, $matches)) {
            return floatval(str_replace(',', '', $matches[1]));
        }
        return 0;
    }

    private function extractPaymentMethodFromNotes($notes)
    {
        if (preg_match('/วิธีการชำระ: (.+)(?:\n|$)/', $notes, $matches)) {
            return trim($matches[1]);
        }
        return null;
    }

    private function extractReferenceFromNotes($notes)
    {
        if (preg_match('/เลขที่อ้างอิง: (.+)(?:\n|$)/', $notes, $matches)) {
            return trim($matches[1]);
        }
        return null;
    }

    /**
     * ปฏิเสธใบแจ้งหนี้ฝั่ง Before Deposit
     * POST /api/v1/invoices/{id}/reject
     */
    public function rejectBefore(RejectInvoiceRequest $request, $id): JsonResponse
    {
        if (!AccountingHelper::hasRole(['admin', 'account'])) {
            return $this->forbiddenResponse('Only admin/account can reject invoices');
        }

        $data = $request->validated();
        $rejectedBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->rejectBefore($id, $data['reason'], $rejectedBy);
        $result = $this->invoiceService->getInvoiceWithUiStatus($invoice);

        return $this->successResponse($result, 'Invoice rejected (before deposit) successfully');
    }

    /**
     * ปฏิเสธใบแจ้งหนี้ฝั่ง After Deposit  
     * POST /api/v1/invoices/{id}/reject-after-deposit
     */
    public function rejectAfter(RejectInvoiceRequest $request, $id): JsonResponse
    {
        if (!AccountingHelper::hasRole(['admin', 'account'])) {
            return $this->forbiddenResponse('Only admin/account can reject invoices');
        }

        $data = $request->validated();
        $rejectedBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->rejectAfter($id, $data['reason'], $rejectedBy);
        $result = $this->invoiceService->getInvoiceWithUiStatus($invoice);

        return $this->successResponse($result, 'Invoice rejected (after deposit) successfully');
    }

    /**
     * เปลี่ยนโหมดการแสดงผล (deposit_display_order)
     * PATCH /api/v1/invoices/{id}/deposit-display-order
     */
    public function setDepositMode(UpdateDepositModeRequest $request, $id): JsonResponse
    {
        $data = $request->validated();
        $updatedBy = AccountingHelper::getCurrentUserId();
        $invoice = $this->invoiceService->setDepositMode($id, $data['deposit_display_order'], $updatedBy);
        $result = $this->invoiceService->getInvoiceWithUiStatus($invoice);

        return $this->successResponse($result, 'Deposit mode updated successfully');
    }

    /**
     * ดึงรายการบริษัทสำหรับ dropdown
     * GET /api/v1/invoices/companies
     */
    public function getCompanies(): JsonResponse
    {
        $companies = \App\Models\Company::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'legal_name', 'short_code']);

        return $this->successResponse($companies, 'Companies retrieved successfully');
    }

    /**
     * ดาวน์โหลด PDF ใบกำกับภาษีแบบ Full (100% - ใช้ Body แบบ Quotation)
     * POST /api/v1/invoices/{id}/pdf/tax/full/download
     */
    public function downloadTaxInvoiceFullPdf(Request $request, $id)
    {
        $invoice = \App\Models\Accounting\Invoice::findOrFail($id);
        $pdfService = app(TaxInvoiceFullPdfMasterService::class);
        $options = $this->extractPdfOptions($request);
        $options['deposit_mode'] = 'full';
        $headerTypes = $request->input('headerTypes');

        if (empty($headerTypes) || !is_array($headerTypes)) {
            return $this->downloadPdfResponse($pdfService, $invoice, $options, 'tax-invoice-full');
        }

        return $this->generateMultiHeaderPdfWithZip($pdfService, $invoice, $headerTypes, $options, 'tax-invoice-full');
    }

    /**
     * ดาวน์โหลด PDF ใบเสร็จรับเงินแบบ Full (100% - ใช้ Body แบบ Quotation)
     * POST /api/v1/invoices/{id}/pdf/receipt/full/download
     */
    public function downloadReceiptFullPdf(Request $request, $id)
    {
        $invoice = \App\Models\Accounting\Invoice::findOrFail($id);
        $pdfService = app(ReceiptFullPdfMasterService::class);
        $options = $this->extractPdfOptions($request);
        $options['deposit_mode'] = 'full';
        $headerTypes = $request->input('headerTypes');

        if (empty($headerTypes) || !is_array($headerTypes)) {
            return $this->downloadPdfResponse($pdfService, $invoice, $options, 'receipt-full');
        }

        return $this->generateMultiHeaderPdfWithZip($pdfService, $invoice, $headerTypes, $options, 'receipt-full');
    }

    /**
     * Helper function to handle PDF generation and download/zip logic.
     * Refactored to accept the specific PDF service instance.
     */
}
