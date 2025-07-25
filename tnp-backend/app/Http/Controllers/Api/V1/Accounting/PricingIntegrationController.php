<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\PricingIntegrationService;
use App\Services\Accounting\QuotationService;
use App\Models\PricingRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PricingIntegrationController extends Controller
{
    protected $pricingIntegrationService;
    protected $quotationService;

    public function __construct(
        PricingIntegrationService $pricingIntegrationService,
        QuotationService $quotationService
    ) {
        $this->pricingIntegrationService = $pricingIntegrationService;
        $this->quotationService = $quotationService;
    }

    /**
     * Get completed pricing requests that can be converted to quotations
     */
    public function getCompletedPricingRequests(Request $request): JsonResponse
    {
        try {
            $filters = [
                'customer_id' => $request->get('customer_id'),
                'search' => $request->get('search'),
                'date_from' => $request->get('date_from'),
                'date_to' => $request->get('date_to'),
                'per_page' => $request->get('per_page', 15)
            ];

            $pricingRequests = $this->pricingIntegrationService->getCompletedPricingRequests($filters);

            return response()->json([
                'status' => 'success',
                'message' => 'Completed pricing requests retrieved successfully',
                'data' => $pricingRequests
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve pricing requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pricing request details for quotation creation
     */
    public function getPricingRequestDetails(string $id): JsonResponse
    {
        try {
            $pricingRequest = $this->pricingIntegrationService->getPricingRequestForQuotation($id);

            if (!$pricingRequest) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Pricing request not found'
                ], 404);
            }

            if (!$this->pricingIntegrationService->canCreateQuotationFromPricing($pricingRequest)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This pricing request cannot be converted to quotation'
                ], 403);
            }

            $summary = $this->pricingIntegrationService->getPricingRequestSummary($pricingRequest);

            return response()->json([
                'status' => 'success',
                'message' => 'Pricing request details retrieved successfully',
                'data' => $summary
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve pricing request details: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create quotation from pricing request
     */
    public function createQuotationFromPricing(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'pricing_request_id' => 'required|string|exists:pricing_requests,pr_id',
                'valid_until' => 'nullable|date|after:today',
                'deposit_amount' => 'nullable|numeric|min:0',
                'payment_terms' => 'nullable|string|max:255',
                'remarks' => 'nullable|string',
                'items' => 'nullable|array',
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

            $pricingRequest = PricingRequest::findOrFail($request->pricing_request_id);

            if (!$this->pricingIntegrationService->canCreateQuotationFromPricing($pricingRequest)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This pricing request cannot be converted to quotation'
                ], 403);
            }

            // Prepare data for quotation creation
            $data = $request->all();
            $data['created_by'] = Auth::user()->user_uuid;

            // If no items provided, auto-generate from pricing request
            if (empty($data['items'])) {
                $data['items'] = $this->pricingIntegrationService->createQuotationItemsWithPricing($pricingRequest);
                $data['subtotal'] = collect($data['items'])->sum(function ($item) {
                    return $item['quantity'] * $item['unit_price'];
                });
            }

            $quotation = $this->quotationService->createFromPricingRequest($pricingRequest, $data);

            return response()->json([
                'status' => 'success',
                'message' => 'Quotation created successfully from pricing request',
                'data' => $quotation
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create quotation from pricing request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pricing request summary with customer data
     */
    public function getPricingRequestSummary(string $id): JsonResponse
    {
        try {
            $pricingRequest = $this->pricingIntegrationService->getPricingRequestForQuotation($id);

            if (!$pricingRequest) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Pricing request not found'
                ], 404);
            }

            $summary = $this->pricingIntegrationService->getPricingRequestSummary($pricingRequest);

            return response()->json([
                'status' => 'success',
                'message' => 'Pricing request summary retrieved successfully',
                'data' => [
                    'pricing_request' => $summary['pricing_request'],
                    'customer' => $summary['customer'],
                    'items' => $summary['items'],
                    'notes' => $summary['notes'],
                    'can_create_quotation' => $this->pricingIntegrationService->canCreateQuotationFromPricing($pricingRequest)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve pricing request summary: ' . $e->getMessage()
            ], 500);
        }
    }
}
