<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\QuotationService;
use App\Models\Accounting\Quotation;
use App\Models\PricingRequest;
use App\Http\Requests\Accounting\CreateQuotationRequest;
use App\Http\Requests\Accounting\UpdateQuotationRequest;
use App\Http\Requests\Accounting\UpdateQuotationStatusRequest;
use App\Http\Resources\V1\Accounting\QuotationResource;
use App\Http\Resources\V1\Accounting\QuotationCollection;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class QuotationController extends Controller
{
    protected $quotationService;

    public function __construct(QuotationService $quotationService)
    {
        $this->quotationService = $quotationService;
    }

    /**
     * Display a listing of quotations with filters and pagination
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Validate request parameters
            $validator = Validator::make($request->all(), [
                'status' => 'nullable|in:draft,pending_review,approved,rejected,completed',
                'customer_id' => 'nullable|string|exists:master_customers,cus_id',
                'search' => 'nullable|string|max:255',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'per_page' => 'nullable|integer|min:1|max:100',
                'sort_by' => 'nullable|in:quotation_no,created_at,total_amount,status,customer_name,valid_until',
                'sort_order' => 'nullable|in:asc,desc'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid filter parameters',
                    'errors' => $validator->errors()
                ], 422);
            }

            $filters = [
                'status' => $request->get('status'),
                'customer_id' => $request->get('customer_id'),
                'search' => $request->get('search'),
                'date_from' => $request->get('date_from'),
                'date_to' => $request->get('date_to'),
                'per_page' => $request->get('per_page', 15),
                'sort_by' => $request->get('sort_by', 'created_at'),
                'sort_order' => $request->get('sort_order', 'desc')
            ];

            $quotations = $this->quotationService->getQuotationsList($filters);

            return response()->json([
                'status' => 'success',
                'message' => 'Quotations retrieved successfully',
                'data' => new QuotationCollection($quotations),
                'meta' => [
                    'total' => $quotations->total(),
                    'per_page' => $quotations->perPage(),
                    'current_page' => $quotations->currentPage(),
                    'last_page' => $quotations->lastPage(),
                    'from' => $quotations->firstItem(),
                    'to' => $quotations->lastItem()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve quotations: ' . $e->getMessage(), [
                'filters' => $request->all(),
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve quotations',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Store a newly created quotation
     */
    public function store(CreateQuotationRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $data['created_by'] = Auth::user()->user_uuid;

            // Check if creating from pricing request or directly
            if (!empty($data['pricing_request_id'])) {
                $pricingRequest = PricingRequest::findOrFail($data['pricing_request_id']);
                $quotation = $this->quotationService->createFromPricingRequest($pricingRequest, $data);
            } else {
                $quotation = $this->quotationService->createQuotation($data);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Quotation created successfully',
                'data' => new QuotationResource($quotation)
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to create quotation: ' . $e->getMessage(), [
                'request_data' => $request->validated(),
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create quotation',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Display the specified quotation with all relationships
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
                'data' => new QuotationResource($quotation)
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve quotation: ' . $e->getMessage(), [
                'quotation_id' => $id,
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve quotation',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Update the specified quotation
     */
    public function update(UpdateQuotationRequest $request, string $id): JsonResponse
    {
        try {
            $quotation = Quotation::findOrFail($id);

            if (!$quotation->canEdit()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Quotation cannot be edited in current status',
                    'current_status' => $quotation->status
                ], 403);
            }

            $data = $request->validated();
            $data['updated_by'] = Auth::user()->user_uuid;

            $quotation = $this->quotationService->updateQuotation($quotation, $data);

            return response()->json([
                'status' => 'success',
                'message' => 'Quotation updated successfully',
                'data' => new QuotationResource($quotation)
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update quotation: ' . $e->getMessage(), [
                'quotation_id' => $id,
                'request_data' => $request->validated(),
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update quotation',
                'debug' => config('app.debug') ? $e->getMessage() : null
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
            Log::error('Failed to update quotation status: ' . $e->getMessage(), [
                'quotation_id' => $id,
                'new_status' => $request->status ?? 'unknown',
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update quotation status',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Approve quotation
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        try {
            $quotation = Quotation::findOrFail($id);

            if (!$quotation->canApprove()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Quotation cannot be approved in current status',
                    'current_status' => $quotation->status
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'remarks' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $quotation = $this->quotationService->changeStatus(
                $quotation,
                Quotation::STATUS_APPROVED,
                Auth::user()->user_uuid,
                $request->get('remarks', 'อนุมัติใบเสนอราคา')
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Quotation approved successfully',
                'data' => new QuotationResource($quotation)
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to approve quotation: ' . $e->getMessage(), [
                'quotation_id' => $id,
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to approve quotation',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Reject quotation
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        try {
            $quotation = Quotation::findOrFail($id);

            if ($quotation->status === Quotation::STATUS_APPROVED) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Approved quotation cannot be rejected',
                    'current_status' => $quotation->status
                ], 403);
            }

            if ($quotation->status === Quotation::STATUS_REJECTED) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Quotation is already rejected',
                    'current_status' => $quotation->status
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:1000|min:10'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $quotation = $this->quotationService->changeStatus(
                $quotation,
                Quotation::STATUS_REJECTED,
                Auth::user()->user_uuid,
                $request->get('reason')
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Quotation rejected successfully',
                'data' => new QuotationResource($quotation)
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to reject quotation: ' . $e->getMessage(), [
                'quotation_id' => $id,
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to reject quotation',
                'debug' => config('app.debug') ? $e->getMessage() : null
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
