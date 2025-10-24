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

class InvoiceController extends Controller
{
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
    public function uploadEvidence(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'files' => 'required|array|min:1',
                'files.*' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240', // 10MB
                'description' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $uploadedBy = auth()->user()->user_uuid ?? null;
            $result = $this->invoiceService->uploadEvidence(
                $id,
                $request->file('files'),
                $request->description,
                $uploadedBy
            );

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Evidence uploaded successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::uploadEvidence error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload evidence: ' . $e->getMessage()
            ], 500);
        }
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
                'type' => $request->query('type'),
                'customer_id' => $request->query('customer_id'),
                'date_from' => $request->query('date_from'),
                'date_to' => $request->query('date_to'),
                'due_date_from' => $request->query('due_date_from'),
                'due_date_to' => $request->query('due_date_to'),
                'overdue' => $request->query('overdue'),
                // 🔽 UPDATED: Handle status, status_before, and status_after
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

            // Remove null filters to avoid sending empty parameters
            $filters = array_filter($filters, fn($value) => !is_null($value));
            
            $perPage = min($request->query('per_page', 20), 100);
            
            $invoices = $this->invoiceService->getList($filters, $perPage);

            return response()->json([
                'success' => true,
                'data' => $invoices,
                'message' => 'Invoices retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
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
                'attachments',
                'items',
                'customer',
                'manager',
                'company',
                'referenceInvoice',
                'afterDepositInvoices'
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
                'subtotal_before_vat' => 'nullable|numeric|min:0',
                'tax_amount' => 'required|numeric|min:0',
                'total_amount' => 'required|numeric|min:0',
                'payment_terms' => 'nullable|string|max:100',
                
                // Deposit fields
                'deposit_amount_before_vat' => 'nullable|numeric|min:0',
                
                // Reference invoice information
                'reference_invoice_id' => 'nullable|string|exists:invoices,id',
                'reference_invoice_number' => 'nullable|string|max:50'
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
                // Company selection (can be changed before approval)
                'company_id' => 'sometimes|nullable|string|exists:companies,id',
                
                // Customer override fields (nullable when not overriding)
                'customer_company' => 'sometimes|nullable|string|max:255',
                'customer_tax_id' => 'sometimes|nullable|string|max:13',
                'customer_address' => 'sometimes|nullable|string|max:2000',
                'customer_zip_code' => 'sometimes|nullable|string|max:10',
                'customer_tel_1' => 'sometimes|nullable|string|max:50',
                'customer_email' => 'sometimes|nullable|string|max:255',
                'customer_firstname' => 'sometimes|nullable|string|max:100',
                'customer_lastname' => 'sometimes|nullable|string|max:100',
                'customer_data_source' => 'sometimes|in:master,invoice',

                // Basic invoice info
                'work_name' => 'sometimes|nullable|string|max:255',
                'quantity' => 'sometimes|integer|min:1',
                'status' => 'sometimes|in:draft,pending,pending_after,approved,sent,partial_paid,fully_paid,overdue',
                'type' => 'sometimes|in:full_amount,remaining,deposit,partial',

                // Financial fields
                'subtotal' => 'sometimes|numeric|min:0',
                'subtotal_before_vat' => 'sometimes|nullable|numeric|min:0',
                'special_discount_percentage' => 'sometimes|numeric|min:0|max:100',
                'special_discount_amount' => 'sometimes|numeric|min:0',
                'has_vat' => 'sometimes|boolean',
                'vat_percentage' => 'sometimes|numeric|min:0|max:100',
                'vat_amount' => 'sometimes|numeric|min:0',
                'tax_amount' => 'sometimes|numeric|min:0', // alias for FE compatibility
                'has_withholding_tax' => 'sometimes|boolean',
                'withholding_tax_percentage' => 'sometimes|numeric|min:0|max:100',
                'withholding_tax_amount' => 'sometimes|numeric|min:0',
                'total_amount' => 'sometimes|numeric|min:0',
                'final_total_amount' => 'sometimes|numeric|min:0',
                'deposit_mode' => 'sometimes|in:percentage,amount',
                'deposit_percentage' => 'sometimes|numeric|min:0|max:100',
                'deposit_amount' => 'sometimes|numeric|min:0',
                'deposit_amount_before_vat' => 'sometimes|nullable|numeric|min:0',
                
                // Reference invoice information
                'reference_invoice_id' => 'sometimes|nullable|string|exists:invoices,id',
                'reference_invoice_number' => 'sometimes|nullable|string|max:50',

                // Payment / terms
                'due_date' => 'sometimes|date',
                'payment_method' => 'sometimes|nullable|string|max:50',
                'payment_terms' => 'nullable|string|max:100',
                'document_header_type' => 'sometimes|nullable|string|max:50',
                'notes' => 'sometimes|nullable|string|max:2000',
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
                'payment_method' => 'nullable|string|max:50',
                'due_date' => 'nullable|date',
                'custom_billing_address' => 'nullable|string|max:2000', // เพิ่มขนาดให้รองรับที่อยู่ยาว
                'document_header_type' => 'nullable|string|max:50',
                'notes' => 'nullable|string|max:1000',
                'customer_data_source' => 'nullable|in:master,invoice',
                
                // Financial fields from frontend calculation
                'subtotal' => 'required|numeric|min:0',
                'subtotal_before_vat' => 'nullable|numeric|min:0',
                'special_discount_percentage' => 'nullable|numeric|min:0|max:100',
                'special_discount_amount' => 'nullable|numeric|min:0',
                'has_vat' => 'nullable|boolean',
                'vat_percentage' => 'nullable|numeric|min:0|max:100',
                'vat_amount' => 'nullable|numeric|min:0',
                'has_withholding_tax' => 'nullable|boolean',
                'withholding_tax_percentage' => 'nullable|numeric|min:0|max:100',
                'withholding_tax_amount' => 'nullable|numeric|min:0',
                'total_amount' => 'required|numeric|min:0',
                'final_total_amount' => 'required|numeric|min:0',
                
                // Deposit information
                'deposit_mode' => 'nullable|in:percentage,amount',
                'deposit_percentage' => 'nullable|numeric|min:0|max:100',
                'deposit_amount' => 'nullable|numeric|min:0',
                'deposit_amount_before_vat' => 'nullable|numeric|min:0',
                
                // Reference invoice information
                'reference_invoice_id' => 'nullable|string|exists:invoices,id',
                'reference_invoice_number' => 'nullable|string|max:50',
                
                // Images
                'signature_images' => 'nullable|array',
                'sample_images' => 'nullable|array',
                
                // Items (optional - can override quotation items if provided)
                'invoice_items' => 'nullable|array',
                'invoice_items.*.pricing_request_id' => 'nullable|string',
                'invoice_items.*.quotation_item_id' => 'nullable|string',
                'invoice_items.*.item_name' => 'nullable|string|max:255',
                'invoice_items.*.item_description' => 'nullable|string|max:1000',
                'invoice_items.*.pattern' => 'nullable|string|max:255',
                'invoice_items.*.fabric_type' => 'nullable|string|max:255',
                'invoice_items.*.color' => 'nullable|string|max:255',
                'invoice_items.*.size' => 'nullable|string|max:100',
                'invoice_items.*.quantity' => 'nullable|integer|min:0',
                'invoice_items.*.unit_price' => 'nullable|numeric|min:0',
                'invoice_items.*.unit' => 'nullable|string|max:50',
                'invoice_items.*.notes' => 'nullable|string|max:1000',
                'invoice_items.*.sequence_order' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                Log::error('InvoiceController::createFromQuotation validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'request_data' => $request->all()
                ]);
                
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
     * ส่งใบแจ้งหนี้เพื่อขออนุมัติฝั่ง Before Deposit (Sales → Account)
     * POST /api/v1/invoices/{id}/submit
     */
    public function submitBefore($id): JsonResponse
    {
        try {
            $submittedBy = auth()->user()->user_uuid ?? null;
            $invoice = $this->invoiceService->submitBefore($id, $submittedBy);

            return response()->json([
                'success' => true,
                'data' => $this->invoiceService->getInvoiceWithUiStatus($invoice),
                'message' => 'Invoice submitted for approval (before deposit) successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::submitBefore error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * อนุมัติใบแจ้งหนี้ฝั่ง Before Deposit
     * POST /api/v1/invoices/{id}/approve
     */
    public function approveBefore(Request $request, $id): JsonResponse
    {
        try {
            // Authorization: only admin/account can approve
            $user = auth()->user();
            $role = $user->role ?? null;
            if (!in_array($role, ['admin','account'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden: only admin/account can approve invoices'
                ], 403);
            }

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
            $invoice = $this->invoiceService->approveBefore($id, $approvedBy, $request->notes);

            return response()->json([
                'success' => true,
                'data' => $this->invoiceService->getInvoiceWithUiStatus($invoice),
                'message' => 'Invoice approved (before deposit) successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::approveBefore error: ' . $e->getMessage());
            
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
     * ส่งขออนุมัติฝั่ง After Deposit
     * POST /api/v1/invoices/{id}/submit-after-deposit
     */
    public function submitAfter(Request $request, $id): JsonResponse
    {
        try {
            // Authorization: only admin/account can submit after-deposit
            $user = auth()->user();
            $role = $user->role ?? null;
            if (!in_array($role, ['admin','account'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden: only admin/account can submit after-deposit'
                ], 403);
            }

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

            $submittedBy = auth()->user()->user_uuid ?? null;
            $invoice = $this->invoiceService->submitAfter($id, $submittedBy);

            return response()->json([
                'success' => true,
                'data' => $this->invoiceService->getInvoiceWithUiStatus($invoice),
                'message' => 'Invoice submitted for after-deposit approval successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::submitAfter error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit invoice for after-deposit approval: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * อนุมัติฝั่ง After Deposit
     * POST /api/v1/invoices/{id}/approve-after-deposit
     */
    public function approveAfter(Request $request, $id): JsonResponse
    {
        try {
            // Authorization: only admin/account can approve after-deposit
            $user = auth()->user();
            $role = $user->role ?? null;
            if (!in_array($role, ['admin','account'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden: only admin/account can approve after-deposit'
                ], 403);
            }

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
            $invoice = $this->invoiceService->approveAfter($id, $approvedBy, $request->notes);

            return response()->json([
                'success' => true,
                'data' => $this->invoiceService->getInvoiceWithUiStatus($invoice),
                'message' => 'Invoice after-deposit approved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::approveAfter error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve invoice after-deposit: ' . $e->getMessage()
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
     * ย้อนสถานะใบแจ้งหนี้กลับเป็น draft
     * POST /api/v1/invoices/{id}/revert-to-draft
     */
    public function revertToDraft(Request $request, $id): JsonResponse
    {
        try {
            // Authorization: only admin/account can revert
            $user = auth()->user();
            $role = $user->role ?? null;
            if (!in_array($role, ['admin','account'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden: only admin/account can revert invoice status'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'side' => 'nullable|in:before,after',
                'reason' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $revertedBy = auth()->user()->user_uuid ?? null;
            $invoice = $this->invoiceService->revertToDraft(
                $id, 
                $request->side, 
                $revertedBy, 
                $request->reason
            );

            return response()->json([
                'success' => true,
                'data' => $this->invoiceService->getInvoiceWithUiStatus($invoice),
                'message' => 'Invoice status reverted to draft successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::revertToDraft error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to revert invoice status: ' . $e->getMessage()
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
     * ปรับการแสดงผลลำดับมัดจำ (presentation only)
     * PATCH /api/v1/invoices/{id}/deposit-display-order
     */
    public function updateDepositDisplayOrder(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'deposit_display_order' => 'required|in:before,after'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updatedBy = auth()->user()->user_uuid ?? null;
            $invoice = $this->invoiceService->updateDepositDisplayOrder($id, $request->deposit_display_order, $updatedBy);

            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Deposit display order updated'
            ]);
        } catch (\Exception $e) {
            \Log::error('InvoiceController::updateDepositDisplayOrder error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update deposit display order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * อัปโหลดหลักฐานการชำระ / หลักฐานอื่นๆ ของ Invoice (mode-specific)
     * POST /api/v1/invoices/{id}/evidence/{mode}
     */
    public function uploadEvidenceByMode(Request $request, $id, $mode): JsonResponse
    {
        try {
            $validator = Validator::make(array_merge($request->all(), ['mode' => $mode]), [
                'files' => 'required|array|min:1|max:10',
                'files.*' => 'file|mimes:jpeg,jpg,png,pdf|max:10240', // 10MB per file
                'description' => 'nullable|string|max:500',
                'mode' => 'required|in:before,after'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $uploadedBy = auth()->user()->user_uuid ?? null;
            $result = $this->invoiceService->uploadEvidenceByMode(
                $id,
                $request->file('files'),
                $mode,
                $request->description,
                $uploadedBy
            );

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Evidence uploaded successfully for ' . $mode . ' mode'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::uploadEvidenceByMode error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload evidence: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * สร้าง PDF ใบแจ้งหนี้
     * GET /api/v1/invoices/{id}/generate-pdf
     */
    public function generatePdf(Request $request, $id): JsonResponse
    {
        try {
            $options = $request->only(['format', 'orientation', 'showWatermark']);
            $headerTypes = $request->input('headerTypes');

            // ใช้ Service method generatePdfBundle เพื่อจัดการทั้ง single และ multi-header
            $result = $this->invoiceService->generatePdfBundle(
                $id,
                is_array($headerTypes) ? $headerTypes : [],
                $options
            );

            return response()->json([
                'success' => true,
                'mode' => $result['mode'] ?? 'single',
                'pdf_url' => $result['pdf_url'] ?? null,
                'filename' => $result['filename'] ?? null,
                'size' => $result['size'] ?? null,
                'type' => $result['type'] ?? null,
                'engine' => $result['engine'] ?? 'mPDF',
                'zip_url' => $result['zip_url'] ?? null,
                'zip_filename' => $result['zip_filename'] ?? null,
                'zip_size' => $result['zip_size'] ?? null,
                'files' => $result['files'] ?? null,
                'count' => $result['count'] ?? null,
                'data' => $result,
                'message' => $this->getPdfGenerationMessage($result)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_type' => 'pdf_generation_failed'
            ], 500);
        }
    }

    /**
     * สร้างข้อความตอบกลับสำหรับการสร้าง PDF
     */
    private function getPdfGenerationMessage(array $result): string
    {
        $mode = $result['mode'] ?? 'single';
        $engine = $result['engine'] ?? 'mPDF';
        
        if ($mode === 'zip') {
            $count = $result['count'] ?? 0;
            return "สร้าง ZIP รวม {$count} ไฟล์ PDF สำเร็จ";
        }
        
        if ($engine === 'fallback') {
            return 'PDF สร้างด้วย fallback method เนื่องจาก mPDF ไม่พร้อมใช้งาน';
        }
        
        return 'PDF สร้างด้วย mPDF สำเร็จ';
    }

    /**
     * แสดง PDF ในเบราว์เซอร์ (ใช้ mPDF) - รองรับ mode parameter
     */
    public function streamPdf(Request $request, $id)
    {
        try {
            $options = $request->only(['format', 'orientation', 'showWatermark']);
            
            // Get mode from query parameter, fallback to invoice's deposit_display_order
            $mode = $request->query('mode');
            if (!in_array($mode, ['before', 'after'])) {
                $invoice = \App\Models\Accounting\Invoice::findOrFail($id);
                $mode = $invoice->deposit_display_order ?? 'before';
            }
            
            $options['deposit_mode'] = $mode;
            
            return $this->invoiceService->streamPdf($id, $options);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to stream PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดาวน์โหลด PDF (alias ของ streamPdf แต่ force download) - รองรับ mode parameter
     */
    public function downloadPdf(Request $request, $id)
    {
        try {
            $options = $request->only(['format', 'orientation', 'showWatermark']);
            $headerTypes = $request->input('headerTypes');
            
            // Get mode from query parameter, fallback to invoice's deposit_display_order
            $mode = $request->query('mode');
            if (!in_array($mode, ['before', 'after'])) {
                $invoice = \App\Models\Accounting\Invoice::findOrFail($id);
                $mode = $invoice->deposit_display_order ?? 'before';
            }
            
            $options['deposit_mode'] = $mode;

            if (empty($headerTypes) || !is_array($headerTypes)) {
                $response = $this->invoiceService->streamPdf($id, $options);
                $invoice = \App\Models\Accounting\Invoice::findOrFail($id);
                $modeLabel = $mode === 'after' ? 'after-deposit' : 'before-deposit';
                $filename = sprintf('invoice-%s-%s.pdf', $invoice->number ?? $invoice->id, $modeLabel);
                return $response->header('Content-Disposition', 'attachment; filename="'.$filename.'"');
            }

            // Multi header direct download: create PDFs and zip
            // โหลด Invoice พร้อม items และ relationships
            $invoice = \App\Models\Accounting\Invoice::with([
                'items',
                'quotation',
                'quotation.items',
                'customer',
                'company',
                'creator',
                'manager',
                'referenceInvoice'
            ])->findOrFail($id);
            
            \Log::info("🔍 Controller downloadPdf: Invoice ID {$id} loaded. Items count: " . ($invoice->relationLoaded('items') ? $invoice->items->count() : 'NOT LOADED'));
            
            $master = app(\App\Services\Accounting\Pdf\InvoicePdfMasterService::class);
            $tmpFiles = [];
            foreach ($headerTypes as $ht) {
                if (!is_string($ht) || trim($ht) === '') continue;
                
                \Log::info("🔍 Controller downloadPdf: Generating PDF for header '{$ht}'. Passing invoice with items.");
                
                // *** แก้ไข: ไม่ใช้ replicate() ใช้ $invoice ตัวเดิมที่มี items ***
                $pdfData = $master->generatePdf($invoice, $options + ['document_header_type' => $ht]);
                $tmpFiles[] = $pdfData['path'];
            }
            if (count($tmpFiles) === 0) {
                throw new \Exception('No files generated');
            }
            if (count($tmpFiles) === 1) {
                $single = $tmpFiles[0];
                return response()->download($single, basename($single), [
                    'Content-Type' => 'application/pdf'
                ]);
            }
            $zipDir = storage_path('app/public/pdfs/invoices/zips');
            if (!is_dir($zipDir)) @mkdir($zipDir, 0755, true);
            $modeLabel = $mode === 'after' ? 'after-deposit' : 'before-deposit';
            $zipName = sprintf('invoice-%s-multi-%s-%s.zip', $invoice->number ?? $invoice->id, $modeLabel, now()->format('YmdHis'));
            $zipPath = $zipDir . DIRECTORY_SEPARATOR . $zipName;
            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE) !== true) {
                throw new \Exception('ไม่สามารถสร้างไฟล์ ZIP');
            }
            foreach ($tmpFiles as $f) {
                if (is_file($f)) { $zip->addFile($f, basename($f)); }
            }
            $zip->close();
            return response()->download($zipPath, $zipName, [
                'Content-Type' => 'application/zip'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to download PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * แสดง PDF ใบกำกับภาษี (Tax Invoice) ในเบราว์เซอร์ตาม mode
     * GET /api/v1/invoices/{id}/pdf/tax/preview?mode=before|after
     */
    public function streamTaxPdf(Request $request, $id)
    {
        try {
            $options = $request->only(['format', 'orientation', 'showWatermark']);
            $mode = $request->query('mode');
            if (!in_array($mode, ['before', 'after'])) {
                $invoice = \App\Models\Accounting\Invoice::findOrFail($id);
                $mode = $invoice->deposit_display_order ?? 'before';
            }
            $options['deposit_mode'] = $mode;

            $service = app(TaxInvoicePdfMasterService::class);
            return $service->streamPdf(\App\Models\Accounting\Invoice::findOrFail($id), $options);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to stream Tax Invoice PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดาวน์โหลด PDF ใบกำกับภาษี (Tax Invoice) - รองรับหลายหัวกระดาษ (zip)
     * POST /api/v1/invoices/{id}/pdf/tax/download
     */
    public function downloadTaxPdf(Request $request, $id)
    {
        try {
            $options = $request->only(['format', 'orientation', 'showWatermark']);
            $headerTypes = $request->input('headerTypes');

            // รับ mode จาก request body (POST) หรือ query string (GET - legacy)
            $mode = $request->input('mode') ?? $request->query('mode');
            if (!in_array($mode, ['before', 'after'])) {
                $invoice = \App\Models\Accounting\Invoice::findOrFail($id);
                $mode = $invoice->deposit_display_order ?? 'before';
            }
            $options['deposit_mode'] = $mode;

            // โหลด Invoice พร้อม items และ relationships
            $invoice = \App\Models\Accounting\Invoice::with([
                'items',
                'quotation',
                'quotation.items',
                'customer',
                'company',
                'creator',
                'manager',
                'referenceInvoice'
            ])->findOrFail($id);
            
            \Log::info("🔍 Controller downloadTaxPdf: Invoice ID {$id} loaded. Items count: " . ($invoice->relationLoaded('items') ? $invoice->items->count() : 'NOT LOADED'));
            
            /** @var TaxInvoicePdfMasterService $master */
            $master = app(TaxInvoicePdfMasterService::class);

            if (empty($headerTypes) || !is_array($headerTypes)) {
                $response = $master->streamPdf($invoice, $options);
                $modeLabel = $mode === 'after' ? 'after-deposit' : 'before-deposit';
                $filename = sprintf('tax-invoice-%s-%s.pdf', $invoice->number ?? $invoice->id, $modeLabel);
                return $response->header('Content-Disposition', 'attachment; filename="'.$filename.'"');
            }

            // Multi-header: create files and zip
            $files = [];
            foreach ($headerTypes as $ht) {
                if (!is_string($ht) || trim($ht) === '') continue;
                
                \Log::info("🔍 Controller downloadTaxPdf: Generating PDF for header '{$ht}'. Passing invoice with items.");
                
                $localOptions = $options + ['document_header_type' => $ht];
                
                // *** แก้ไข: ไม่ใช้ replicate() ใช้ $invoice ตัวเดิมที่มี items ***
                $pdfData = $master->generatePdf($invoice, $localOptions);
                $files[] = [
                    'type' => $ht,
                    'path' => $pdfData['path'],
                    'filename' => $pdfData['filename'],
                    'size' => $pdfData['size'],
                    'url' => $pdfData['url']
                ];
            }

            if (count($files) === 0) {
                throw new \Exception('No valid header types generated');
            }

            if (count($files) === 1) {
                // Single file - return JSON with URL
                $fileData = $files[0];
                return response()->json([
                    'message' => 'PDF generated successfully.',
                    'pdf_url' => $fileData['url'],
                    'filename' => $fileData['filename'],
                    'mode' => 'single',
                ]);
            }

            // Multiple files - create ZIP and return JSON with URL
            $zipDir = storage_path('app/public/pdfs/tax-invoices/zips');
            if (!is_dir($zipDir)) @mkdir($zipDir, 0755, true);
            $modeLabel = $mode === 'after' ? 'after-deposit' : 'before-deposit';
            $zipName = sprintf('tax-invoices-%s-%s-%s.zip', $invoice->number ?? $invoice->id, $modeLabel, now()->format('YmdHis'));
            $zipPath = $zipDir . DIRECTORY_SEPARATOR . $zipName;
            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
                throw new \Exception('ไม่สามารถสร้างไฟล์ ZIP');
            }
            foreach ($files as $f) {
                if (is_file($f['path'])) {
                    $zip->addFile($f['path'], $f['filename']);
                }
            }
            $zip->close();
            
            // Return JSON with ZIP URL
            $zipUrl = url('storage/pdfs/tax-invoices/zips/' . $zipName);
            return response()->json([
                'message' => 'PDF bundle generated successfully.',
                'zip_url' => $zipUrl,
                'zip_filename' => $zipName,
                'mode' => 'zip',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to download Tax Invoice PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * แสดง PDF ใบเสร็จรับเงิน (Receipt) ในเบราว์เซอร์ตาม mode
     * GET /api/v1/invoices/{id}/pdf/receipt/preview?mode=before|after
     */
    public function streamReceiptPdf(Request $request, $id)
    {
        try {
            $options = $request->only(['format', 'orientation', 'showWatermark']);
            $mode = $request->query('mode');
            if (!in_array($mode, ['before', 'after'])) {
                $invoice = \App\Models\Accounting\Invoice::findOrFail($id);
                $mode = $invoice->deposit_display_order ?? 'before';
            }
            $options['deposit_mode'] = $mode;

            $service = app(ReceiptPdfMasterService::class);
            return $service->streamPdf(\App\Models\Accounting\Invoice::findOrFail($id), $options);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to stream Receipt PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดาวน์โหลด PDF ใบเสร็จรับเงิน (Receipt) - รองรับหลายหัวกระดาษ (zip)
     * POST /api/v1/invoices/{id}/pdf/receipt/download
     */
    public function downloadReceiptPdf(Request $request, $id)
    {
        try {
            $options = $request->only(['format', 'orientation', 'showWatermark']);
            $headerTypes = $request->input('headerTypes');

            // รับ mode จาก request body (POST) หรือ query string (GET - legacy)
            $mode = $request->input('mode') ?? $request->query('mode');
            if (!in_array($mode, ['before', 'after'])) {
                $invoice = \App\Models\Accounting\Invoice::findOrFail($id);
                $mode = $invoice->deposit_display_order ?? 'before';
            }
            $options['deposit_mode'] = $mode;

            // โหลด Invoice พร้อม items และ relationships
            $invoice = \App\Models\Accounting\Invoice::with([
                'items',
                'quotation',
                'quotation.items',
                'customer',
                'company',
                'creator',
                'manager',
                'referenceInvoice'
            ])->findOrFail($id);
            
            \Log::info("🔍 Controller downloadReceiptPdf: Invoice ID {$id} loaded. Items count: " . ($invoice->relationLoaded('items') ? $invoice->items->count() : 'NOT LOADED'));
            
            /** @var ReceiptPdfMasterService $master */
            $master = app(ReceiptPdfMasterService::class);

            if (empty($headerTypes) || !is_array($headerTypes)) {
                $response = $master->streamPdf($invoice, $options);
                $modeLabel = $mode === 'after' ? 'after-deposit' : 'before-deposit';
                $filename = sprintf('receipt-%s-%s.pdf', $invoice->number ?? $invoice->id, $modeLabel);
                return $response->header('Content-Disposition', 'attachment; filename="'.$filename.'"');
            }

            // Multi-header: create files and zip
            $files = [];
            foreach ($headerTypes as $ht) {
                if (!is_string($ht) || trim($ht) === '') continue;
                
                \Log::info("🔍 Controller downloadReceiptPdf: Generating PDF for header '{$ht}'. Passing invoice with items.");
                
                $localOptions = $options + ['document_header_type' => $ht];
                
                // *** แก้ไข: ไม่ใช้ replicate() ใช้ $invoice ตัวเดิมที่มี items ***
                $pdfData = $master->generatePdf($invoice, $localOptions);
                $files[] = [
                    'type' => $ht,
                    'path' => $pdfData['path'],
                    'filename' => $pdfData['filename'],
                    'size' => $pdfData['size'],
                    'url' => $pdfData['url']
                ];
            }

            if (count($files) === 0) {
                throw new \Exception('No valid header types generated');
            }

            if (count($files) === 1) {
                // Single file - return JSON with URL
                $fileData = $files[0];
                return response()->json([
                    'message' => 'PDF generated successfully.',
                    'pdf_url' => $fileData['url'],
                    'filename' => $fileData['filename'],
                    'mode' => 'single',
                ]);
            }

            // Multiple files - create ZIP and return JSON with URL
            $zipDir = storage_path('app/public/pdfs/receipts/zips');
            if (!is_dir($zipDir)) @mkdir($zipDir, 0755, true);
            $modeLabel = $mode === 'after' ? 'after-deposit' : 'before-deposit';
            $zipName = sprintf('receipts-%s-%s-%s.zip', $invoice->number ?? $invoice->id, $modeLabel, now()->format('YmdHis'));
            $zipPath = $zipDir . DIRECTORY_SEPARATOR . $zipName;
            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
                throw new \Exception('ไม่สามารถสร้างไฟล์ ZIP');
            }
            foreach ($files as $f) {
                if (is_file($f['path'])) {
                    $zip->addFile($f['path'], $f['filename']);
                }
            }
            $zip->close();
            
            // Return JSON with ZIP URL
            $zipUrl = url('storage/pdfs/receipts/zips/' . $zipName);
            return response()->json([
                'message' => 'PDF bundle generated successfully.',
                'zip_url' => $zipUrl,
                'zip_filename' => $zipName,
                'mode' => 'zip',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to download Receipt PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ตรวจสอบสถานะระบบ PDF
     */
    public function checkPdfStatus(): JsonResponse
    {
        try {
            $status = $this->invoiceService->checkPdfSystemStatus();
            
            return response()->json([
                'success' => true,
                'data' => $status
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check PDF status: ' . $e->getMessage()
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

    /**
     * ปฏิเสธใบแจ้งหนี้ฝั่ง Before Deposit
     * POST /api/v1/invoices/{id}/reject
     */
    public function rejectBefore(Request $request, $id): JsonResponse
    {
        try {
            // Authorization: only admin/account can reject
            $user = auth()->user();
            $role = $user->role ?? null;
            if (!in_array($role, ['admin','account'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden: only admin/account can reject invoices'
                ], 403);
            }

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
            $invoice = $this->invoiceService->rejectBefore($id, $request->reason, $rejectedBy);

            return response()->json([
                'success' => true,
                'data' => $this->invoiceService->getInvoiceWithUiStatus($invoice),
                'message' => 'Invoice rejected (before deposit) successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::rejectBefore error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ปฏิเสธใบแจ้งหนี้ฝั่ง After Deposit  
     * POST /api/v1/invoices/{id}/reject-after-deposit
     */
    public function rejectAfter(Request $request, $id): JsonResponse
    {
        try {
            // Authorization: only admin/account can reject
            $user = auth()->user();
            $role = $user->role ?? null;
            if (!in_array($role, ['admin','account'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden: only admin/account can reject invoices'
                ], 403);
            }

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
            $invoice = $this->invoiceService->rejectAfter($id, $request->reason, $rejectedBy);

            return response()->json([
                'success' => true,
                'data' => $this->invoiceService->getInvoiceWithUiStatus($invoice),
                'message' => 'Invoice rejected (after deposit) successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::rejectAfter error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * เปลี่ยนโหมดการแสดงผล (deposit_display_order)
     * PATCH /api/v1/invoices/{id}/deposit-display-order
     */
    public function setDepositMode(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'deposit_display_order' => 'required|string|in:before,after'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updatedBy = auth()->user()->user_uuid ?? null;
            $invoice = $this->invoiceService->setDepositMode(
                $id, 
                $request->deposit_display_order, 
                $updatedBy
            );

            return response()->json([
                'success' => true,
                'data' => $this->invoiceService->getInvoiceWithUiStatus($invoice),
                'message' => 'Deposit mode updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::setDepositMode error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update deposit mode: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดึงรายการบริษัทสำหรับ dropdown
     * GET /api/v1/invoices/companies
     */
    public function getCompanies(): JsonResponse
    {
        try {
            $companies = \App\Models\Company::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'legal_name', 'short_code']);

            return response()->json([
                'success' => true,
                'data' => $companies,
                'message' => 'Companies retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('InvoiceController::getCompanies error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve companies: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดาวน์โหลด PDF ใบกำกับภาษีแบบ Full (100% - ใช้ Body แบบ Quotation)
     * POST /api/v1/invoices/{id}/pdf/tax/full/download
     */
    public function downloadTaxInvoiceFullPdf(Request $request, $id)
    {
        try {
            $invoice = \App\Models\Accounting\Invoice::findOrFail($id);
            $pdfService = app(TaxInvoiceFullPdfMasterService::class);
            return $this->handlePdfDownload($request, $invoice, $pdfService, 'full');
        } catch (\Exception $e) {
            Log::error('InvoiceController::downloadTaxInvoiceFullPdf error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to download Tax Invoice Full PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดาวน์โหลด PDF ใบเสร็จรับเงินแบบ Full (100% - ใช้ Body แบบ Quotation)
     * POST /api/v1/invoices/{id}/pdf/receipt/full/download
     */
    public function downloadReceiptFullPdf(Request $request, $id)
    {
        try {
            $invoice = \App\Models\Accounting\Invoice::findOrFail($id);
            $pdfService = app(ReceiptFullPdfMasterService::class);
            return $this->handlePdfDownload($request, $invoice, $pdfService, 'full');
        } catch (\Exception $e) {
            Log::error('InvoiceController::downloadReceiptFullPdf error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to download Receipt Full PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper function to handle PDF generation and download/zip logic.
     * Refactored to accept the specific PDF service instance.
     */
    protected function handlePdfDownload(Request $request, $invoice, $pdfService, ?string $mode = null)
    {
        // ใช้ mode จาก request ถ้ามี, หรือจาก parameter
        $requestedMode = $request->input('mode', $mode); // 'before', 'after', 'full'

        // Header types from request (array)
        $headerTypes = $request->input('headerTypes', ['ต้นฉบับ']);
        if (!is_array($headerTypes)) {
            $headerTypes = ['ต้นฉบับ'];
        }
        // Ensure at least one header type
        if (empty($headerTypes)) {
            $headerTypes = [$invoice->document_header_type ?? 'ต้นฉบับ'];
        }

        $generatedFiles = [];
        $errors = [];

        foreach ($headerTypes as $headerType) {
            try {
                // ส่ง options ไปให้ service รวมถึง deposit_mode และ document_header_type
                $options = [
                    'document_header_type' => $headerType,
                    // ส่ง deposit_mode ที่ถูกต้อง (before/after/full) ไปยัง buildViewData และ addHeaderFooter
                    'deposit_mode' => $requestedMode ?? $invoice->deposit_display_order ?? 'before',
                ];

                $result = $pdfService->generatePdf($invoice, $options);
                $generatedFiles[] = $result;
            } catch (\Throwable $e) {
                $errors[] = "Error generating PDF for header '$headerType': " . $e->getMessage();
                Log::error("PDF Generation Error (Invoice ID: {$invoice->id}, Header: $headerType, Mode: $requestedMode): " . $e->getMessage(), ['exception' => $e]);
            }
        }

        if (empty($generatedFiles) && !empty($errors)) {
            return response()->json(['message' => 'Failed to generate PDF(s).', 'errors' => $errors], 500);
        }

        if (count($generatedFiles) === 1) {
            // Single PDF download
            $fileData = $generatedFiles[0];
            // Ensure the path uses DIRECTORY_SEPARATOR for the server OS
            $filePath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $fileData['path']);

            if (file_exists($filePath)) {
                // Return URL for frontend to handle download
                return response()->json([
                    'message' => 'PDF generated successfully.',
                    'pdf_url' => $fileData['url'],
                    'filename' => $fileData['filename'],
                    'mode' => 'single',
                ]);
                // ---- OR ----
                // Direct file download (might be blocked by browser popup blockers)
                // return response()->download($filePath, $fileData['filename'])->deleteFileAfterSend(true);
            } else {
                return response()->json(['message' => 'Generated PDF file not found.'], 404);
            }
        } else {
            // Multiple PDFs, create a zip file
            $zipFileName = sprintf('%s-%s-%s-bundle-%s.zip',
                method_exists($pdfService, 'getFilenamePrefix') ? $pdfService->getFilenamePrefix() : 'pdf',
                $invoice->number ?? $invoice->id,
                $requestedMode ?? 'multi',
                now()->format('YmdHis')
            );
            $zipPath = storage_path('app/public/temp/' . $zipFileName);

            if (!is_dir(dirname($zipPath))) {
                mkdir(dirname($zipPath), 0755, true);
            }

            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
                foreach ($generatedFiles as $fileData) {
                    $filePath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $fileData['path']);
                    if (file_exists($filePath)) {
                        // Sanitize filename inside zip
                        $filenameInZip = Str::slug(pathinfo($fileData['filename'], PATHINFO_FILENAME), '-') . '.pdf';
                        $zip->addFile($filePath, $filenameInZip);
                    } else {
                        Log::warning("File not found for zipping: " . $filePath);
                    }
                }
                $zip->close();

                // Clean up individual PDFs after zipping
                foreach ($generatedFiles as $fileData) {
                    $filePath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $fileData['path']);
                    if (file_exists($filePath)) {
                        @unlink($filePath);
                    }
                }

                // Return URL to the zip file
                $zipUrl = Storage::url('temp/' . $zipFileName);
                // Make sure the URL is absolute
                if (!Str::startsWith($zipUrl, ['http://', 'https://'])) {
                    $zipUrl = url($zipUrl);
                }

                return response()->json([
                    'message' => 'PDF bundle generated successfully.',
                    'zip_url' => $zipUrl,
                    'zip_filename' => $zipFileName,
                    'mode' => 'zip',
                ]);
                // ---- OR ----
                // Direct zip download
                // return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);
            } else {
                return response()->json(['message' => 'Could not create zip file.'], 500);
            }
        }
    }
}
