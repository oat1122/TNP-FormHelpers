<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\QuotationService;
use App\Models\Accounting\Quotation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class QuotationController extends Controller
{
    protected $quotationService;

    public function __construct(QuotationService $quotationService)
    {
        $this->quotationService = $quotationService;
    }

    /**
     * ดึงรายการใบเสนอราคา
     * GET /api/v1/quotations
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'status' => $request->query('status'),
                'customer_id' => $request->query('customer_id'),
                'created_by' => $request->query('created_by'),
                'date_from' => $request->query('date_from'),
                'date_to' => $request->query('date_to'),
                'search' => $request->query('search')
            ];

            $perPage = min($request->query('per_page', 15), 50); // จำกัดไม่เกิน 50 รายการต่อหน้า
            
            $quotations = $this->quotationService->getList($filters, $perPage);
            
            return response()->json([
                'success' => true,
                'data' => $quotations,
                'message' => 'Quotations retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::index error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve quotations: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * สร้างใบเสนอราคาใหม่
     * POST /api/v1/quotations
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'pricing_request_id' => 'nullable|string|exists:pricing_requests,pr_id',
                'customer_company' => 'required|string|max:255',
                'work_name' => 'required|string|max:100',
                'subtotal' => 'required|numeric|min:0',
                'tax_amount' => 'required|numeric|min:0',
                'total_amount' => 'required|numeric|min:0',
                'deposit_percentage' => 'nullable|integer|min:0|max:100',
                'payment_terms' => 'nullable|string|max:50',
                'due_date' => 'nullable|date',
                'notes' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();
            $createdBy = auth()->user()->user_uuid ?? null;

            // ถ้ามี pricing_request_id ให้สร้างจาก Pricing Request
            if (!empty($data['pricing_request_id'])) {
                $additionalData = collect($data)->except(['pricing_request_id'])->toArray();
                $quotation = $this->quotationService->createFromPricingRequest(
                    $data['pricing_request_id'],
                    $additionalData,
                    $createdBy
                );
            } else {
                // สร้างใบเสนอราคาใหม่
                $quotation = $this->quotationService->create($data, $createdBy);
            }
            
            return response()->json([
                'success' => true,
                'data' => $quotation,
                'message' => 'Quotation created successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('QuotationController::store error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดึงข้อมูลใบเสนอราคาตาม ID
     * GET /api/v1/quotations/{id}
     */
    public function show($id): JsonResponse
    {
        try {
            $quotation = Quotation::with([
                'customer',
                'pricingRequest',
                'creator',
                'approver',
                'documentHistory.actionBy',
                'attachments',
                'orderItemsTracking'
            ])->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $quotation,
                'message' => 'Quotation retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::show error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve quotation: ' . $e->getMessage()
            ], 404);
        }
    }

    /**
     * อัปเดตใบเสนอราคา
     * PUT /api/v1/quotations/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'customer_company' => 'sometimes|string|max:255',
                'work_name' => 'sometimes|string|max:100',
                'subtotal' => 'sometimes|numeric|min:0',
                'tax_amount' => 'sometimes|numeric|min:0',
                'total_amount' => 'sometimes|numeric|min:0',
                'deposit_percentage' => 'nullable|integer|min:0|max:100',
                'payment_terms' => 'nullable|string|max:50',
                'due_date' => 'nullable|date',
                'notes' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();
            $updatedBy = auth()->user()->user_uuid ?? null;

            $quotation = $this->quotationService->update($id, $data, $updatedBy);
            
            return response()->json([
                'success' => true,
                'data' => $quotation,
                'message' => 'Quotation updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::update error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ลบใบเสนอราคา
     * DELETE /api/v1/quotations/{id}
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            $reason = $request->input('reason');
            $deletedBy = auth()->user()->user_uuid ?? null;

            $this->quotationService->delete($id, $deletedBy, $reason);
            
            return response()->json([
                'success' => true,
                'message' => 'Quotation deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::destroy error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ส่งใบเสนอราคาเพื่อขออนุมัติ
     * POST /api/v1/quotations/{id}/submit
     */
    public function submit($id): JsonResponse
    {
        try {
            $submittedBy = auth()->user()->user_uuid ?? null;
            
            $quotation = $this->quotationService->submitForReview($id, $submittedBy);
            
            return response()->json([
                'success' => true,
                'data' => $quotation,
                'message' => 'Quotation submitted for review successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::submit error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * อนุมัติใบเสนอราคา
     * POST /api/v1/quotations/{id}/approve
     */
    public function approve(Request $request, $id): JsonResponse
    {
        try {
            $notes = $request->input('notes');
            $approvedBy = auth()->user()->user_uuid ?? null;
            
            $quotation = $this->quotationService->approve($id, $approvedBy, $notes);
            
            return response()->json([
                'success' => true,
                'data' => $quotation,
                'message' => 'Quotation approved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::approve error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ปฏิเสธใบเสนอราคา
     * POST /api/v1/quotations/{id}/reject
     */
    public function reject(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $reason = $request->input('reason');
            $rejectedBy = auth()->user()->user_uuid ?? null;
            
            $quotation = $this->quotationService->reject($id, $rejectedBy, $reason);
            
            return response()->json([
                'success' => true,
                'data' => $quotation,
                'message' => 'Quotation rejected successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::reject error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * แปลงใบเสนอราคาเป็นใบแจ้งหนี้
     * POST /api/v1/quotations/{id}/convert-to-invoice
     */
    public function convertToInvoice(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'due_date' => 'nullable|date',
                'payment_method' => 'nullable|string|max:50',
                'notes' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $additionalData = $validator->validated();
            $convertedBy = auth()->user()->user_uuid ?? null;
            
            $invoice = $this->quotationService->convertToInvoice($id, $convertedBy, $additionalData);
            
            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Quotation converted to invoice successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::convertToInvoice error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to convert quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * สร้างใบเสนอราคาจาก Pricing Request (Auto-fill)
     * POST /api/v1/quotations/create-from-pricing
     */
    public function createFromPricingRequest(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'pricing_request_id' => 'required|string|exists:pricing_requests,pr_id',
                'subtotal' => 'required|numeric|min:0',
                'tax_amount' => 'required|numeric|min:0',
                'total_amount' => 'required|numeric|min:0',
                'deposit_percentage' => 'nullable|integer|min:0|max:100',
                'payment_terms' => 'nullable|string|max:50',
                'notes' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();
            $createdBy = auth()->user()->user_uuid ?? null;

            $pricingRequestId = $data['pricing_request_id'];
            $additionalData = collect($data)->except(['pricing_request_id'])->toArray();
            
            $quotation = $this->quotationService->createFromPricingRequest(
                $pricingRequestId,
                $additionalData,
                $createdBy
            );
            
            return response()->json([
                'success' => true,
                'data' => $quotation,
                'message' => 'Quotation created from pricing request successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('QuotationController::createFromPricingRequest error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create quotation from pricing request: ' . $e->getMessage()
            ], 500);
        }
    }
}
