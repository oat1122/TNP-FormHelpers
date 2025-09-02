<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class InvoiceController extends Controller
{
    protected $invoiceService;

    public function __construct(InvoiceService $invoiceService)
    {
        $this->invoiceService = $invoiceService;
    }

    /**
     * GET /api/v1/invoices/quotations-awaiting
     * List quotations that are signed and approved, with no invoice yet
     */
    public function quotationsAwaiting(Request $request): JsonResponse
    {
        try {
            $filters = [
                'search' => $request->query('search'),
            ];
            $perPage = min($request->query('per_page', 20), 50);
            $data = $this->invoiceService->getQuotationsAwaiting($filters, $perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Quotations awaiting invoice retrieved successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('InvoiceController::quotationsAwaiting error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve quotations: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ดึงรายการ Invoice พร้อม Filter
     * GET /api/v1/invoices
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'search' => $request->query('search'),
                'status' => $request->query('status'),
                'type' => $request->query('type'),
                'customer_id' => $request->query('customer_id'),
                'date_from' => $request->query('date_from'),
                'date_to' => $request->query('date_to'),
                'due_date_from' => $request->query('due_date_from'),
                'due_date_to' => $request->query('due_date_to'),
                'overdue' => $request->query('overdue')
            ];

            $perPage = min($request->query('per_page', 20), 50);
            
            $invoices = $this->invoiceService->getList($filters, $perPage);

            return response()->json([
                'success' => true,
                'data' => $invoices,
                'message' => 'Invoices retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::index error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve invoices: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดูรายละเอียด Invoice
     * GET /api/v1/invoices/{id}
     */
    public function show($id): JsonResponse
    {
        try {
            $invoice = \App\Models\Accounting\Invoice::with([
                'quotation',
                'documentHistory',
                'documentAttachments'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Invoice details retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::show error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve invoice details: ' . $e->getMessage()
            ], 404);
        }
    }

    /**
     * สร้าง Invoice แบบ Manual
     * POST /api/v1/invoices
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'company_id' => 'nullable|string|exists:companies,id',
                'customer_company' => 'required|string|max:255',
                'customer_tax_id' => 'required|string|max:13',
                'customer_address' => 'required|string|max:500',
                'work_name' => 'required|string|max:255',
                'quantity' => 'required|integer|min:1',
                'subtotal' => 'required|numeric|min:0',
                'tax_amount' => 'required|numeric|min:0',
                'total_amount' => 'required|numeric|min:0',
                'payment_terms' => 'nullable|string|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $createdBy = auth()->user()->user_uuid ?? null;
            $invoice = $this->invoiceService->create($request->all(), $createdBy);

            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Invoice created successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('InvoiceController::store error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * แก้ไข Invoice
     * PUT /api/v1/invoices/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'customer_company' => 'sometimes|string|max:255',
                'customer_tax_id' => 'sometimes|string|max:13',
                'customer_address' => 'sometimes|string|max:500',
                'work_name' => 'sometimes|string|max:255',
                'quantity' => 'sometimes|integer|min:1',
                'subtotal' => 'sometimes|numeric|min:0',
                'tax_amount' => 'sometimes|numeric|min:0',
                'total_amount' => 'sometimes|numeric|min:0',
                'payment_terms' => 'nullable|string|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updatedBy = auth()->user()->user_uuid ?? null;
            $invoice = $this->invoiceService->update($id, $request->all(), $updatedBy);

            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Invoice updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::update error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ลบ Invoice
     * DELETE /api/v1/invoices/{id}
     */
    public function destroy($id): JsonResponse
    {
        try {
            $invoice = \App\Models\Accounting\Invoice::findOrFail($id);

            if ($invoice->status !== 'draft') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only draft invoices can be deleted'
                ], 400);
            }

            $invoice->delete();

            return response()->json([
                'success' => true,
                'message' => 'Invoice deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::destroy error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * One-Click Conversion จาก Quotation เป็น Invoice
     * POST /api/v1/invoices/create-from-quotation
     */
    public function createFromQuotation(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'quotation_id' => 'required|string|exists:quotations,id',
                'type' => 'required|in:full_amount,remaining,deposit,partial',
                'custom_amount' => 'required_if:type,partial|numeric|min:0',
                'payment_terms' => 'nullable|string|max:100',
                'due_date' => 'nullable|date',
                'custom_billing_address' => 'nullable|string|max:1000',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $createdBy = auth()->user()->user_uuid ?? null;
            $invoice = $this->invoiceService->createFromQuotation(
                $request->quotation_id,
                $request->all(),
                $createdBy
            );

            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Invoice created from quotation successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('InvoiceController::createFromQuotation error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create invoice from quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ส่งใบแจ้งหนี้เพื่อขออนุมัติ
     * POST /api/v1/invoices/{id}/submit
     */
    public function submit($id): JsonResponse
    {
        try {
            $submittedBy = auth()->user()->user_uuid ?? null;
            $invoice = $this->invoiceService->submit($id, $submittedBy);

            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Invoice submitted for approval successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::submit error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * อนุมัติใบแจ้งหนี้
     * POST /api/v1/invoices/{id}/approve
     */
    public function approve(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $approvedBy = auth()->user()->user_uuid ?? null;
            $invoice = $this->invoiceService->approve($id, $approvedBy, $request->notes);

            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Invoice approved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::approve error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ปฏิเสธใบแจ้งหนี้
     * POST /api/v1/invoices/{id}/reject
     */
    public function reject(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $rejectedBy = auth()->user()->user_uuid ?? null;
            $invoice = $this->invoiceService->reject($id, $request->reason, $rejectedBy);

            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Invoice rejected successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::reject error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ส่งกลับแก้ไข
     * POST /api/v1/invoices/{id}/send-back
     */
    public function sendBack(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $actionBy = auth()->user()->user_uuid ?? null;
            $invoice = $this->invoiceService->sendBack($id, $request->reason, $actionBy);

            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Invoice sent back for editing successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::sendBack error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send back invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ส่งใบแจ้งหนี้ให้ลูกค้า
     * POST /api/v1/invoices/{id}/send-to-customer
     */
    public function sendToCustomer(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'delivery_method' => 'required|string|max:50',
                'recipient_email' => 'nullable|email|max:255',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $sentBy = auth()->user()->user_uuid ?? null;
            $invoice = $this->invoiceService->sendToCustomer($id, $request->all(), $sentBy);

            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Invoice sent to customer successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::sendToCustomer error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send invoice to customer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * บันทึกการชำระเงิน
     * POST /api/v1/invoices/{id}/record-payment
     */
    public function recordPayment(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:0.01',
                'payment_method' => 'nullable|string|max:50',
                'reference_number' => 'nullable|string|max:100',
                'payment_date' => 'nullable|date',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $recordedBy = auth()->user()->user_uuid ?? null;
            $invoice = $this->invoiceService->recordPayment($id, $request->all(), $recordedBy);

            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Payment recorded successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::recordPayment error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to record payment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * สร้าง PDF ใบแจ้งหนี้
     * GET /api/v1/invoices/{id}/generate-pdf
     */
    public function generatePdf($id): JsonResponse
    {
        try {
            $pdfData = $this->invoiceService->generatePdf($id);

            return response()->json([
                'success' => true,
                'data' => $pdfData,
                'message' => 'PDF generated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::generatePdf error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดูประวัติการชำระเงิน
     * GET /api/v1/invoices/{id}/payment-history
     */
    public function getPaymentHistory($id): JsonResponse
    {
        try {
            $invoice = \App\Models\Accounting\Invoice::with([
                'documentHistory' => function($query) {
                    $query->where('action_type', 'record_payment')
                          ->orderBy('created_at', 'desc');
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

            return response()->json([
                'success' => true,
                'data' => [
                    'invoice_id' => $invoice->id,
                    'invoice_number' => $invoice->number,
                    'total_amount' => $invoice->total_amount,
                    'paid_amount' => $invoice->paid_amount ?? 0,
                    'remaining_amount' => $invoice->remaining_amount,
                    'payment_history' => $paymentHistory
                ],
                'message' => 'Payment history retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::getPaymentHistory error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve payment history: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ส่งการแจ้งเตือนการชำระ
     * POST /api/v1/invoices/{id}/send-reminder
     */
    public function sendReminder(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'reminder_type' => 'required|in:gentle,urgent,final',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $invoice = \App\Models\Accounting\Invoice::findOrFail($id);

            if (!in_array($invoice->status, ['sent', 'partial_paid'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Reminder can only be sent for invoices that are sent or partially paid'
                ], 400);
            }

            // TODO: Implement actual reminder sending logic

            // บันทึก History
            $actionBy = auth()->user()->user_uuid ?? null;
            \App\Models\Accounting\DocumentHistory::logAction(
                'invoice',
                $id,
                'send_reminder',
                $actionBy,
                "ส่งการแจ้งเตือน ({$request->reminder_type}): " . ($request->notes ?? '')
            );

            return response()->json([
                'success' => true,
                'message' => 'Payment reminder sent successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::sendReminder error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send reminder: ' . $e->getMessage()
            ], 500);
        }
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
}
