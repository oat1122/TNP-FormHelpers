<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\ReceiptService;
use App\Models\Accounting\Receipt;
use App\Models\Accounting\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ReceiptController extends Controller
{
    protected $receiptService;

    public function __construct(ReceiptService $receiptService)
    {
        $this->receiptService = $receiptService;
    }

    /**
     * Display a listing of receipts
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'status' => $request->get('status'),
                'payment_method' => $request->get('payment_method'),
                'customer_id' => $request->get('customer_id'),
                'search' => $request->get('search'),
                'date_from' => $request->get('date_from'),
                'date_to' => $request->get('date_to'),
                'payment_date_from' => $request->get('payment_date_from'),
                'payment_date_to' => $request->get('payment_date_to'),
                'per_page' => $request->get('per_page', 15)
            ];

            $receipts = $this->receiptService->getReceiptsList($filters);

            return response()->json([
                'status' => 'success',
                'message' => 'Receipts retrieved successfully',
                'data' => $receipts
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve receipts: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created receipt
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'invoice_id' => 'required|uuid|exists:invoices,id',
                'payment_method' => 'required|in:cash,bank_transfer,cheque,credit_card',
                'payment_reference' => 'nullable|string|max:255',
                'payment_date' => 'required|date',
                'remarks' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $invoice = Invoice::findOrFail($request->invoice_id);

            if (!$this->receiptService->canCreateReceipt($invoice)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot create receipt from invoice in current status'
                ], 403);
            }
            
            $data = $request->all();
            $data['created_by'] = Auth::user()->user_uuid;

            $receipt = $this->receiptService->createFromInvoice($invoice, $data);

            return response()->json([
                'status' => 'success',
                'message' => 'Receipt created successfully',
                'data' => $receipt
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create receipt: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified receipt
     */
    public function show(string $id): JsonResponse
    {
        try {
            $receipt = $this->receiptService->getReceiptWithRelations($id);

            if (!$receipt) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Receipt not found'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Receipt retrieved successfully',
                'data' => $receipt
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve receipt: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified receipt
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $receipt = Receipt::findOrFail($id);

            if (!$receipt->canEdit()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Receipt cannot be edited in current status'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'tax_rate' => 'nullable|numeric|min:0|max:100',
                'payment_method' => 'nullable|in:cash,bank_transfer,cheque,credit_card',
                'payment_reference' => 'nullable|string|max:255',
                'payment_date' => 'nullable|date',
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

            $receipt = $this->receiptService->updateReceipt($receipt, $data);

            return response()->json([
                'status' => 'success',
                'message' => 'Receipt updated successfully',
                'data' => $receipt
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update receipt: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified receipt
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $receipt = Receipt::findOrFail($id);

            if (!$receipt->canEdit()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Receipt cannot be deleted in current status'
                ], 403);
            }

            $receipt->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Receipt deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete receipt: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change receipt status
     */
    public function changeStatus(Request $request, string $id): JsonResponse
    {
        try {
            $receipt = Receipt::findOrFail($id);

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
            if ($newStatus === 'approved' && !$receipt->canApprove()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Receipt cannot be approved in current status'
                ], 403);
            }

            $receipt = $this->receiptService->changeStatus($receipt, $newStatus, $userId, $remarks);

            return response()->json([
                'status' => 'success',
                'message' => 'Receipt status updated successfully',
                'data' => $receipt
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update receipt status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate PDF for receipt
     */
    public function generatePdf(string $id): JsonResponse
    {
        try {
            $receipt = $this->receiptService->getReceiptWithRelations($id);

            if (!$receipt) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Receipt not found'
                ], 404);
            }

            // TODO: Implement PDF generation logic
            
            return response()->json([
                'status' => 'success',
                'message' => 'PDF generated successfully',
                'data' => [
                    'pdf_url' => url('api/v1/receipts/' . $id . '/download-pdf')
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
     * Get receipt history
     */
    public function getHistory(string $id): JsonResponse
    {
        try {
            $receipt = Receipt::with('statusHistory.user')->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'message' => 'Receipt history retrieved successfully',
                'data' => $receipt->statusHistory
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve receipt history: ' . $e->getMessage()
            ], 500);
        }
    }
}
