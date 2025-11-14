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
    // Require authentication for all quotation endpoints so created_by uses auth()->user()->user_uuid
    $this->middleware('auth:sanctum');
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
                'search' => $request->query('search'),
                // New filter: show only quotations that have uploaded signature evidence
                // Accepts: signature_uploaded=1|true or 0|false
                'signature_uploaded' => $request->query('signature_uploaded')
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
                'company_id' => 'nullable|string|exists:companies,id',
                'pricing_request_id' => 'nullable|string|exists:pricing_requests,pr_id',
                'customer_company' => 'required|string|max:255',
                'work_name' => 'required|string|max:100',
                'subtotal' => 'required|numeric|min:0',
                'tax_amount' => 'required|numeric|min:0',
                'special_discount_percentage' => 'nullable|numeric|min:0|max:100',
                'special_discount_amount' => 'nullable|numeric|min:0',
                'has_withholding_tax' => 'nullable|boolean',
                'withholding_tax_percentage' => 'nullable|numeric|min:0|max:10',
                'withholding_tax_amount' => 'nullable|numeric|min:0',
                'final_total_amount' => 'nullable|numeric|min:0',
                'total_amount' => 'required|numeric|min:0',
                'has_vat' => 'nullable|boolean',
                'vat_percentage' => 'nullable|numeric|min:0|max:100',
                'pricing_mode' => 'nullable|in:net,vat_included',
                // Allow decimal precision for reverse-calculated percentage when amount mode is used
                'deposit_percentage' => 'nullable|numeric|min:0|max:100',
                'deposit_mode' => 'nullable|in:percentage,amount',
                'deposit_amount' => 'nullable|numeric|min:0',
                'payment_terms' => 'nullable|string|max:50',
                'due_date' => 'nullable|date',
                'notes' => 'nullable|string',
                'sample_images' => 'nullable|array',
                'items' => 'nullable|array',
                'items.*.item_name' => 'required_with:items|string|max:255',
                'items.*.quantity' => 'required_with:items|integer|min:1',
                'items.*.unit_price' => 'required_with:items|numeric|min:0',
                'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
                'items.*.discount_amount' => 'nullable|numeric|min:0',
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
                'company',
                'pricingRequest',
                'creator',
                'approver',
                'documentHistory.actionBy',
                'attachments',
                'orderItemsTracking',
                'items'
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
                'company_id' => 'nullable|string|exists:companies,id',
                'customer_company' => 'sometimes|string|max:255',
                'work_name' => 'sometimes|string|max:100',
                'subtotal' => 'sometimes|numeric|min:0',
                'tax_amount' => 'sometimes|numeric|min:0',
                // Extended financial fields (optional on update)
                'special_discount_percentage' => 'sometimes|numeric|min:0|max:100',
                'special_discount_amount' => 'sometimes|numeric|min:0',
                'has_withholding_tax' => 'sometimes|boolean',
                'withholding_tax_percentage' => 'sometimes|numeric|min:0|max:10',
                'withholding_tax_amount' => 'sometimes|numeric|min:0',
                'final_total_amount' => 'sometimes|numeric|min:0',
                'total_amount' => 'sometimes|numeric|min:0',
                'has_vat' => 'sometimes|boolean',
                'vat_percentage' => 'sometimes|numeric|min:0|max:100',
                'pricing_mode' => 'sometimes|in:net,vat_included',
                // Allow decimal precision for reverse-calculated percentage when amount mode is used
                'deposit_percentage' => 'nullable|numeric|min:0|max:100',
                'deposit_mode' => 'nullable|in:percentage,amount',
                'deposit_amount' => 'nullable|numeric|min:0',
                'payment_terms' => 'nullable|string|max:50',
                'due_date' => 'nullable|date',
                'notes' => 'nullable|string',
                'sample_images' => 'nullable|array',
                // Optional: full replacement of quotation items when provided
                'items' => 'nullable|array',
                'items.*.pricing_request_id' => 'nullable|string|exists:pricing_requests,pr_id',
                'items.*.item_name' => 'required_with:items|string|max:255',
                'items.*.item_description' => 'nullable|string',
                'items.*.pattern' => 'nullable|string|max:255',
                'items.*.fabric_type' => 'nullable|string|max:255',
                'items.*.color' => 'nullable|string|max:255',
                'items.*.size' => 'nullable|string|max:255',
                'items.*.unit_price' => 'required_with:items|numeric|min:0',
                'items.*.quantity' => 'required_with:items|integer|min:0',
                'items.*.unit' => 'nullable|string|max:50',
                'items.*.discount_percentage' => 'nullable|numeric|min:0',
                'items.*.discount_amount' => 'nullable|numeric|min:0',
                'items.*.notes' => 'nullable|string',
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
     * ดึงข้อมูลใบเสนอราคาสำหรับทำสำเนา
     * GET /api/v1/quotations/{id}/duplicate-data
     */
    public function getDuplicateData($id): JsonResponse
    {
        try {
            // เรียก Service เพื่อเตรียมข้อมูล
            $duplicateData = $this->quotationService->getDataForDuplication($id);
            
            return response()->json([
                'success' => true,
                'data' => $duplicateData,
                'message' => 'Quotation data for duplication retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::getDuplicateData error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve quotation data for duplication: ' . $e->getMessage()
            ], 404);
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
                // New: support special discount & withholding tax fields
                'special_discount_percentage' => 'nullable|numeric|min:0|max:100',
                'special_discount_amount' => 'nullable|numeric|min:0',
                'has_withholding_tax' => 'nullable|boolean',
                'withholding_tax_percentage' => 'nullable|numeric|min:0|max:10',
                'withholding_tax_amount' => 'nullable|numeric|min:0',
                'final_total_amount' => 'nullable|numeric|min:0',
                'total_amount' => 'required|numeric|min:0',
                'has_vat' => 'nullable|boolean',
                'vat_percentage' => 'nullable|numeric|min:0|max:100',
                'pricing_mode' => 'nullable|in:net,vat_included',
                // Allow decimal precision for reverse-calculated percentage when amount mode is used
                'deposit_percentage' => 'nullable|numeric|min:0|max:100',
                'deposit_mode' => 'nullable|in:percentage,amount',
                'deposit_amount' => 'nullable|numeric|min:0',
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

    /**
     * สร้างใบเสนอราคาจากหลาย Pricing Requests (Multi-select)
     * POST /api/v1/quotations/create-from-multiple-pricing
     */
    public function createFromMultiplePricingRequests(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'pricing_request_ids' => 'required|array|min:1',
                'pricing_request_ids.*' => 'required|string|exists:pricing_requests,pr_id',
                'customer_id' => 'required|string|exists:master_customers,cus_id',
                'additional_notes' => 'nullable|string',
                'subtotal' => 'nullable|numeric|min:0',
                'tax_amount' => 'nullable|numeric|min:0',
                // New: support special discount & withholding tax fields (optional on multi-create)
                'special_discount_percentage' => 'nullable|numeric|min:0|max:100',
                'special_discount_amount' => 'nullable|numeric|min:0',
                'has_withholding_tax' => 'nullable|boolean',
                'withholding_tax_percentage' => 'nullable|numeric|min:0|max:10',
                'withholding_tax_amount' => 'nullable|numeric|min:0',
                'final_total_amount' => 'nullable|numeric|min:0',
                'total_amount' => 'nullable|numeric|min:0',
                'has_vat' => 'nullable|boolean',
                'vat_percentage' => 'nullable|numeric|min:0|max:100',
                'pricing_mode' => 'nullable|in:net,vat_included',
                // Allow decimal precision for reverse-calculated percentage when amount mode is used
                'deposit_percentage' => 'nullable|numeric|min:0|max:100',
                'deposit_mode' => 'nullable|in:percentage,amount',
                'deposit_amount' => 'nullable|numeric|min:0',
                'payment_terms' => 'nullable|string|max:50',
                'sample_images' => 'nullable|array',
                'items' => 'nullable|array',
                'items.*.pricing_request_id' => 'nullable|string|exists:pricing_requests,pr_id',
                'items.*.item_name' => 'required_with:items|string|max:255',
                'items.*.item_description' => 'nullable|string',
                'items.*.pattern' => 'nullable|string|max:255',
                'items.*.fabric_type' => 'nullable|string|max:255',
                'items.*.color' => 'nullable|string|max:255',
                'items.*.size' => 'nullable|string|max:255',
                'items.*.unit_price' => 'required_with:items|numeric|min:0',
                'items.*.quantity' => 'required_with:items|integer|min:0',
                'items.*.unit' => 'nullable|string|max:50',
                'items.*.discount_percentage' => 'nullable|numeric|min:0',
                'items.*.discount_amount' => 'nullable|numeric|min:0',
                'items.*.notes' => 'nullable|string'
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

            $quotation = $this->quotationService->createFromMultiplePricingRequests(
                $data['pricing_request_ids'],
                $data['customer_id'],
                $data,
                $createdBy
            );
            
            return response()->json([
                'success' => true,
                'data' => $quotation,
                'message' => 'Quotation created from multiple pricing requests successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('QuotationController::createFromMultiplePricingRequests error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create quotation from multiple pricing requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * สร้างใบเสนอราคาแบบ Standalone (ไม่ต้องอิง Pricing Request)
     * POST /api/v1/quotations/create-standalone
     */
    public function createStandalone(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'company_id' => 'required|string|exists:companies,id',
                'customer_id' => 'required|string|exists:master_customers,cus_id',
                'work_name' => 'required|string|max:100',
                // เพิ่ม validation สำหรับ pricing request fields
                'primary_pricing_request_id' => 'nullable|string',
                'primary_pricing_request_ids' => 'nullable|array',
                'items' => 'required|array|min:1',
                'items.*.item_name' => 'required|string|max:255',
                'items.*.item_description' => 'nullable|string',
                'items.*.pattern' => 'nullable|string|max:255',
                'items.*.fabric_type' => 'nullable|string|max:255',
                'items.*.color' => 'nullable|string|max:255',
                'items.*.size' => 'nullable|string|max:255',
                'items.*.unit_price' => 'required|numeric|min:0',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit' => 'nullable|string|max:50',
                'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
                'items.*.discount_amount' => 'nullable|numeric|min:0',
                'items.*.notes' => 'nullable|string',
                'items.*.sequence_order' => 'nullable|integer|min:1',
                // Financial fields
                'special_discount_percentage' => 'nullable|numeric|min:0|max:100',
                'special_discount_amount' => 'nullable|numeric|min:0',
                'has_vat' => 'nullable|boolean',
                'vat_percentage' => 'nullable|numeric|min:0|max:100',
                'has_withholding_tax' => 'nullable|boolean',
                'withholding_tax_percentage' => 'nullable|numeric|min:0|max:10',
                'deposit_mode' => 'nullable|in:percentage,amount',
                'deposit_percentage' => 'nullable|numeric|min:0|max:100',
                'deposit_amount' => 'nullable|numeric|min:0',
                'payment_terms' => 'nullable|string|max:50',
                'due_date' => 'nullable|date',
                'notes' => 'nullable|string',
                'document_header_type' => 'nullable|string|max:50',
                'sample_images' => 'nullable|array',
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

            $quotation = $this->quotationService->createStandalone($data, $createdBy);
            
            return response()->json([
                'success' => true,
                'data' => $quotation->load(['customer', 'company', 'items', 'creator']),
                'message' => 'Quotation created successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('QuotationController::createStandalone error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create standalone quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ส่งกลับแก้ไข (Account ส่งกลับให้ Sales)
     * POST /api/v1/quotations/{id}/send-back
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

            $reason = $request->input('reason');
            $actionBy = auth()->user()->user_uuid ?? null;
            
            $quotation = $this->quotationService->sendBackForEdit($id, $reason, $actionBy);
            
            return response()->json([
                'success' => true,
                'data' => $quotation,
                'message' => 'Quotation sent back for editing successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::sendBack error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send back quotation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ยกเลิกการอนุมัติ (Account)
     * POST /api/v1/quotations/{id}/revoke-approval
     */
    public function revokeApproval(Request $request, $id): JsonResponse
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

            $reason = $request->input('reason');
            $actionBy = auth()->user()->user_uuid ?? null;
            
            $quotation = $this->quotationService->revokeApproval($id, $reason, $actionBy);
            
            return response()->json([
                'success' => true,
                'data' => $quotation,
                'message' => 'Quotation approval revoked successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::revokeApproval error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to revoke approval: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * สร้างและบันทึก PDF (ใช้ mPDF เป็นหลัก)
     */
    public function generatePdf(Request $request, $id)
    {
        try {
            $options = $request->only(['format', 'orientation', 'showWatermark']);
            $result = $this->quotationService->generatePdf($id, $options);
            
            return response()->json([
                'success' => true,
                'pdf_url' => $result['url'] ?? null,
                'filename' => $result['filename'] ?? null,
                'size' => $result['size'] ?? null,
                'type' => $result['type'] ?? null,
                'engine' => $result['engine'] ?? 'mPDF',
                'data' => $result,
                'message' => isset($result['engine']) && $result['engine'] === 'fpdf' 
                    ? 'PDF สร้างด้วย FPDF (fallback) เนื่องจาก mPDF ไม่พร้อมใช้งาน' 
                    : 'PDF สร้างด้วย mPDF สำเร็จ'
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
     * แสดง PDF ในเบราว์เซอร์ (ใช้ mPDF)
     */
    public function streamPdf(Request $request, $id)
    {
        try {
            $options = $request->only(['format', 'orientation', 'showWatermark']);
            return $this->quotationService->streamPdf($id, $options);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถแสดง PDF ได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดาวน์โหลด PDF
     */
    public function downloadPdf(Request $request, $id)
    {
        try {
            $result = $this->quotationService->generatePdf($id, $request->only(['format', 'orientation']));
            $filename = $result['filename'] ?? ('quotation-' . $id . '.pdf');
            $path = $result['path'] ?? null;
            if (!$path || !is_file($path)) {
                throw new \Exception('PDF ยังไม่พร้อมดาวน์โหลด');
            }
            return response()->download($path, $filename, [
                'Content-Type' => 'application/pdf'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถดาวน์โหลด PDF ได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ตรวจสอบสถานะระบบ PDF
     */
    public function checkPdfStatus()
    {
        try {
            $status = $this->quotationService->checkPdfSystemStatus();
            
            return response()->json([
                'success' => true,
                'system_ready' => $status['system_ready'],
                'preferred_engine' => $status['preferred_engine'],
                'components' => $status['components'],
                'recommendations' => $status['recommendations']
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'preferred_engine' => 'FPDF'
            ], 500);
        }
    }

    /**
     * ทดสอบการสร้าง PDF ด้วย mPDF
     */
    public function testMpdf(Request $request, $id)
    {
        try {
            $quotation = Quotation::with(['customer', 'company', 'items'])->findOrFail($id);
            $masterService = app(\App\Services\Accounting\Pdf\QuotationPdfMasterService::class);
            
            // ทดสอบสถานะระบบ
            $systemStatus = $masterService->checkSystemStatus();
            
            if (empty($systemStatus['all_ready']) || !$systemStatus['all_ready']) {
                return response()->json([
                    'success' => false,
                    'message' => 'ระบบ mPDF ไม่พร้อมใช้งาน',
                    'system_status' => $systemStatus,
                    'action' => 'fix_system_first'
                ], 422);
            }
            
            // ทดสอบสร้าง PDF
            $result = $masterService->generatePdf($quotation, [
                'showWatermark' => true,
                'format' => 'A4'
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'ทดสอบ mPDF สำเร็จ!',
                'pdf_url' => $result['url'] ?? null,
                'filename' => $result['filename'] ?? null,
                'size' => $result['size'] ?? null,
                'system_status' => $systemStatus
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ทดสอบ mPDF ไม่สำเร็จ: ' . $e->getMessage(),
                'error_trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * ส่งอีเมลใบเสนอราคา
     * POST /api/v1/quotations/{id}/send-email
     */
    public function sendEmail(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'recipient_email' => 'required|email',
                'subject' => 'nullable|string|max:255',
                'message' => 'nullable|string|max:2000',
                'include_pdf' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $emailData = $validator->validated();
            $sentBy = auth()->user()->user_uuid ?? null;
            
            $result = $this->quotationService->sendEmail($id, $emailData, $sentBy);
            
            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Email sent successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::sendEmail error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send email: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * อัปโหลดหลักฐานการส่ง
     * POST /api/v1/quotations/{id}/upload-evidence
     */
    public function uploadEvidence(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'files.*' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240', // 10MB max
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
            $description = $request->input('description');
            
            $result = $this->quotationService->uploadEvidence($id, $request->file('files'), $description, $uploadedBy);
            
            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Evidence uploaded successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::uploadEvidence error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload evidence: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * อัปโหลดรูปหลักฐานการเซ็น (images only) - เฉพาะใบเสนอราคา approved และผู้ใช้ role sale/admin เท่านั้น
     * POST /api/v1/quotations/{id}/upload-signatures
     */
    public function uploadSignatures(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'files' => 'required',
                'files.*' => 'required|image|mimes:jpg,jpeg,png|max:5120', // 5MB per image
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            $role = $user->role ?? null;
            if (!in_array($role, ['admin','sale'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์อัปโหลดหลักฐานการเซ็น'
                ], 403);
            }

        // รองรับ keys แบบ files[] จาก FormData
        $rawFiles = $request->file('files');
            // Normalise to array
            if ($rawFiles === null) {
                return response()->json([
                    'success' => false,
            'message' => 'ไม่พบไฟล์สำหรับอัปโหลด',
            'errors' => ['files' => ['No uploaded files found']]
                ], 422);
            }
            $files = is_array($rawFiles) ? $rawFiles : [$rawFiles];
            if (count($files) === 0) {
                return response()->json([
                    'success' => false,
            'message' => 'ไม่พบไฟล์สำหรับอัปโหลด',
            'errors' => ['files' => ['Empty files array']]
                ], 422);
            }

            $result = $this->quotationService->uploadSignatures($id, $files, $user->user_uuid ?? null);

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'อัปโหลดรูปหลักฐานการเซ็นเรียบร้อย'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::uploadSignatures error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload signatures: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload sample images and append to quotation->sample_images
     * POST /api/v1/quotations/{id}/upload-sample-images
     */
    public function uploadSampleImages(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'files' => 'required',
                'files.*' => 'required|image|mimes:jpg,jpeg,png|max:5120',
            ]);
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            $rawFiles = $request->file('files');
            if ($rawFiles === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'No uploaded files found',
                    'errors' => ['files' => ['No uploaded files found']]
                ], 422);
            }
            $files = is_array($rawFiles) ? $rawFiles : [$rawFiles];

            $result = $this->quotationService->uploadSampleImages($id, $files, $user->user_uuid ?? null);

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Sample images uploaded successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::uploadSampleImages error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload sample images: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload sample images without binding to quotation (for create form)
     * POST /api/v1/quotations/upload-sample-images
     */
    public function uploadSampleImagesTemp(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'files' => 'required',
                'files.*' => 'required|image|mimes:jpg,jpeg,png|max:5120',
            ]);
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $rawFiles = $request->file('files');
            $files = is_array($rawFiles) ? $rawFiles : [$rawFiles];
            $user = auth()->user();

            $result = $this->quotationService->uploadSampleImagesNoBind($files, $user->user_uuid ?? null);
            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Sample images uploaded successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('QuotationController::uploadSampleImagesTemp error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload sample images: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ลบรูปหลักฐานการเซ็น 1 รูป
     * DELETE /api/v1/quotations/{id}/signatures/{identifier}
     * identifier: index (0-based) หรือ filename
     */
    public function deleteSignatureImage($id, $identifier): JsonResponse
    {
        try {
            $user = auth()->user();
            $role = $user->role ?? null;
            if (!in_array($role, ['admin','sale'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ลบรูปหลักฐานการเซ็น'
                ], 403);
            }

            $result = $this->quotationService->deleteSignatureImage($id, $identifier, $user->user_uuid ?? null);
            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'ลบรูปหลักฐานการเซ็นเรียบร้อย'
            ]);
        } catch (\Exception $e) {
            Log::error('QuotationController::deleteSignatureImage error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete signature image: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * มาร์คว่าลูกค้าตอบรับแล้ว
     * POST /api/v1/quotations/{id}/mark-completed
     */
    public function markCompleted(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'completion_notes' => 'nullable|string|max:1000',
                'customer_response' => 'nullable|string|max:2000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();
            $completedBy = auth()->user()->user_uuid ?? null;
            
            $quotation = $this->quotationService->markCompleted($id, $data, $completedBy);
            
            return response()->json([
                'success' => true,
                'data' => $quotation,
                'message' => 'Quotation marked as completed successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::markCompleted error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark quotation as completed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * บันทึกการส่งเอกสาร (อัปเดตสถานะเป็น 'sent')
     * POST /api/v1/quotations/{id}/mark-sent
     */
    public function markSent(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'delivery_method' => 'required|in:email,hand_delivery,postal,courier',
                'delivery_notes' => 'nullable|string|max:1000',
                'recipient_name' => 'nullable|string|max:255',
                'delivery_date' => 'nullable|date'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();
            $sentBy = auth()->user()->user_uuid ?? null;
            
            $quotation = $this->quotationService->markSent($id, $data, $sentBy);
            
            return response()->json([
                'success' => true,
                'data' => $quotation,
                'message' => 'Quotation marked as sent successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('QuotationController::markSent error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark quotation as sent: ' . $e->getMessage()
            ], 500);
        }
    }
}
