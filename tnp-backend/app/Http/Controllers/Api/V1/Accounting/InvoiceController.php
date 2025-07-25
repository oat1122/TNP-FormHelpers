<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\InvoiceService;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\Quotation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class InvoiceController extends Controller
{
    protected $invoiceService;

    public function __construct(InvoiceService $invoiceService)
    {
        $this->invoiceService = $invoiceService;
    }

    /**
     * Display a listing of invoices
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'status' => $request->get('status'),
                'payment_status' => $request->get('payment_status'),
                'customer_id' => $request->get('customer_id'),
                'search' => $request->get('search'),
                'date_from' => $request->get('date_from'),
                'date_to' => $request->get('date_to'),
                'due_date_from' => $request->get('due_date_from'),
                'due_date_to' => $request->get('due_date_to'),
                'per_page' => $request->get('per_page', 15)
            ];

            $invoices = $this->invoiceService->getInvoicesList($filters);

            return response()->json([
                'status' => 'success',
                'message' => 'Invoices retrieved successfully',
                'data' => $invoices
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve invoices: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created invoice
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'quotation_id' => 'required|uuid|exists:quotations,id',
                'credit_term_days' => 'nullable|integer|min:0|max:365',
                'remarks' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $quotation = Quotation::findOrFail($request->quotation_id);

            if (!$this->invoiceService->canCreateInvoice($quotation)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot create invoice from quotation in current status'
                ], 403);
            }
            
            $data = $request->all();
            $data['created_by'] = Auth::user()->user_uuid;

            $invoice = $this->invoiceService->createFromQuotation($quotation, $data);

            return response()->json([
                'status' => 'success',
                'message' => 'Invoice created successfully',
                'data' => $invoice
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified invoice
     */
    public function show(string $id): JsonResponse
    {
        try {
            $invoice = $this->invoiceService->getInvoiceWithRelations($id);

            if (!$invoice) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invoice not found'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Invoice retrieved successfully',
                'data' => $invoice
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified invoice
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $invoice = Invoice::findOrFail($id);

            if (!$invoice->canEdit()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invoice cannot be edited in current status'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'subtotal' => 'nullable|numeric|min:0',
                'tax_rate' => 'nullable|numeric|min:0|max:100',
                'credit_term_days' => 'nullable|integer|min:0|max:365',
                'remarks' => 'nullable|string',
                'items' => 'nullable|array|min:1',
                'items.*.item_name' => 'required_with:items|string|max:255',
                'items.*.item_description' => 'nullable|string',
                'items.*.quantity' => 'required_with:items|numeric|min:0.01',
                'items.*.unit' => 'nullable|string|max:50',
                'items.*.unit_price' => 'required_with:items|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();
            $data['updated_by'] = Auth::user()->user_uuid;

            $invoice = $this->invoiceService->updateInvoice($invoice, $data);

            return response()->json([
                'status' => 'success',
                'message' => 'Invoice updated successfully',
                'data' => $invoice
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified invoice
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $invoice = Invoice::findOrFail($id);

            if (!$invoice->canEdit()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invoice cannot be deleted in current status'
                ], 403);
            }

            $invoice->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Invoice deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change invoice status
     */
    public function changeStatus(Request $request, string $id): JsonResponse
    {
        try {
            $invoice = Invoice::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:draft,pending_review,approved,rejected,completed',
                'remarks' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $newStatus = $request->status;
            $remarks = $request->remarks;
            $userId = Auth::user()->user_uuid;

            // Validate status transition
            if ($newStatus === 'approved' && !$invoice->canApprove()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invoice cannot be approved in current status'
                ], 403);
            }

            $invoice = $this->invoiceService->changeStatus($invoice, $newStatus, $userId, $remarks);

            return response()->json([
                'status' => 'success',
                'message' => 'Invoice status updated successfully',
                'data' => $invoice
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update invoice status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Record payment for invoice
     */
    public function recordPayment(Request $request, string $id): JsonResponse
    {
        try {
            $invoice = Invoice::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:0.01',
                'remarks' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $amount = $request->amount;
            $remarks = $request->remarks;
            $userId = Auth::user()->user_uuid;

            // Check if payment amount doesn't exceed remaining amount
            if ($amount > $invoice->remaining_amount) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Payment amount cannot exceed remaining amount'
                ], 422);
            }

            $invoice = $this->invoiceService->recordPayment($invoice, $amount, $userId, $remarks);

            return response()->json([
                'status' => 'success',
                'message' => 'Payment recorded successfully',
                'data' => $invoice
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to record payment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get overdue invoices
     */
    public function getOverdue(): JsonResponse
    {
        try {
            $overdueInvoices = $this->invoiceService->getOverdueInvoices();

            return response()->json([
                'status' => 'success',
                'message' => 'Overdue invoices retrieved successfully',
                'data' => $overdueInvoices
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve overdue invoices: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate PDF for invoice
     */
    public function generatePdf(string $id): JsonResponse
    {
        try {
            $invoice = $this->invoiceService->getInvoiceWithRelations($id);

            if (!$invoice) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invoice not found'
                ], 404);
            }

            // TODO: Implement PDF generation logic
            
            return response()->json([
                'status' => 'success',
                'message' => 'PDF generated successfully',
                'data' => [
                    'pdf_url' => url('api/v1/invoices/' . $id . '/download-pdf')
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get invoice history
     */
    public function getHistory(string $id): JsonResponse
    {
        try {
            $invoice = Invoice::with('statusHistory.user')->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'message' => 'Invoice history retrieved successfully',
                'data' => $invoice->statusHistory
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve invoice history: ' . $e->getMessage()
            ], 500);
        }
    }
}
