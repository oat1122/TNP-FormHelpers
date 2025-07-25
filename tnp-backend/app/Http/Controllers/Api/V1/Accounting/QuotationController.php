<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\QuotationService;
use App\Models\Accounting\Quotation;
use App\Models\PricingRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class QuotationController extends Controller
{
    protected $quotationService;

    public function __construct(QuotationService $quotationService)
    {
        $this->quotationService = $quotationService;
    }

    /**
     * Display a listing of quotations
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'status' => $request->get('status'),
                'customer_id' => $request->get('customer_id'),
                'search' => $request->get('search'),
                'date_from' => $request->get('date_from'),
                'date_to' => $request->get('date_to'),
                'per_page' => $request->get('per_page', 15)
            ];

            $quotations = $this->quotationService->getQuotationsList($filters);

            return response()->json([
                'status' => 'success',
                'message' => 'Quotations retrieved successfully',
                'data' => $quotations
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve quotations: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created quotation
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'pricing_request_id' => 'required|uuid|exists:pricing_requests,pr_id',
                'subtotal' => 'required|numeric|min:0',
                'tax_rate' => 'required|numeric|min:0|max:100',
                'deposit_amount' => 'nullable|numeric|min:0',
                'payment_terms' => 'nullable|string|max:255',
                'valid_until' => 'nullable|date|after:today',
                'remarks' => 'nullable|string',
                'items' => 'required|array|min:1',
                'items.*.item_name' => 'required|string|max:255',
                'items.*.item_description' => 'nullable|string',
                'items.*.quantity' => 'required|numeric|min:0.01',
                'items.*.unit' => 'nullable|string|max:50',
                'items.*.unit_price' => 'required|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $pricingRequest = PricingRequest::findOrFail($request->pricing_request_id);
            
            $data = $request->all();
            $data['created_by'] = Auth::user()->user_uuid;

            $quotation = $this->quotationService->createFromPricingRequest($pricingRequest, $data);

            return response()->json([
                'status' => 'success',
                'message' => 'Quotation created successfully',
                'data' => $quotation
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified quotation
     */
    public function show(string $id): JsonResponse
    {
        try {
            $quotation = $this->quotationService->getQuotationWithRelations($id);

            if (!$quotation) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Quotation not found'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Quotation retrieved successfully',
                'data' => $quotation
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified quotation
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $quotation = Quotation::findOrFail($id);

            if (!$quotation->canEdit()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Quotation cannot be edited in current status'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'subtotal' => 'nullable|numeric|min:0',
                'tax_rate' => 'nullable|numeric|min:0|max:100',
                'deposit_amount' => 'nullable|numeric|min:0',
                'payment_terms' => 'nullable|string|max:255',
                'valid_until' => 'nullable|date|after:today',
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

            $quotation = $this->quotationService->updateQuotation($quotation, $data);

            return response()->json([
                'status' => 'success',
                'message' => 'Quotation updated successfully',
                'data' => $quotation
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified quotation
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $quotation = Quotation::findOrFail($id);

            if (!$quotation->canEdit()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Quotation cannot be deleted in current status'
                ], 403);
            }

            $quotation->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Quotation deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change quotation status
     */
    public function changeStatus(Request $request, string $id): JsonResponse
    {
        try {
            $quotation = Quotation::findOrFail($id);

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
            if ($newStatus === 'approved' && !$quotation->canApprove()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Quotation cannot be approved in current status'
                ], 403);
            }

            if ($newStatus === 'rejected' && $quotation->status === 'approved') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Approved quotation cannot be rejected'
                ], 403);
            }

            $quotation = $this->quotationService->changeStatus($quotation, $newStatus, $userId, $remarks);

            return response()->json([
                'status' => 'success',
                'message' => 'Quotation status updated successfully',
                'data' => $quotation
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update quotation status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate PDF for quotation
     */
    public function generatePdf(string $id): JsonResponse
    {
        try {
            $quotation = $this->quotationService->getQuotationWithRelations($id);

            if (!$quotation) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Quotation not found'
                ], 404);
            }

            // TODO: Implement PDF generation logic
            // This would typically use a PDF library like dompdf or tcpdf
            
            return response()->json([
                'status' => 'success',
                'message' => 'PDF generated successfully',
                'data' => [
                    'pdf_url' => url('api/v1/quotations/' . $id . '/download-pdf')
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
     * Get quotation history
     */
    public function getHistory(string $id): JsonResponse
    {
        try {
            $quotation = Quotation::with('statusHistory.user')->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'message' => 'Quotation history retrieved successfully',
                'data' => $quotation->statusHistory
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve quotation history: ' . $e->getMessage()
            ], 500);
        }
    }
}
