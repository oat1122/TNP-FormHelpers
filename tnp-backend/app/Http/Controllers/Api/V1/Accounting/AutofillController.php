<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\AutofillService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class AutofillController extends Controller
{
    protected $autofillService;

    public function __construct(AutofillService $autofillService)
    {
        $this->autofillService = $autofillService;
    }

    /**
     * ดึงข้อมูล Auto-fill จาก Pricing Request
     * GET /api/v1/quotations/autofill/pricing-request/{id}
     */
    public function getPricingRequestAutofill($pricingRequestId): JsonResponse
    {
        try {
            $autofillData = $this->autofillService->getAutofillDataFromPricingRequest($pricingRequestId);
            
            return response()->json([
                'success' => true,
                'data' => $autofillData,
                'message' => 'Auto-fill data retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('AutofillController::getPricingRequestAutofill error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve auto-fill data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดึงข้อมูลลูกค้าสำหรับ Auto-fill
     * GET /api/v1/customers/{id}/details
     */
    public function getCustomerDetails($customerId): JsonResponse
    {
        try {
            $customerData = $this->autofillService->getCustomerAutofillData($customerId);
            
            return response()->json([
                'success' => true,
                'data' => $customerData,
                'message' => 'Customer details retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('AutofillController::getCustomerDetails error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customer details: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ค้นหาลูกค้า (Auto-complete)
     * GET /api/v1/customers/search
     */
    public function searchCustomers(Request $request): JsonResponse
    {
        try {
            $searchTerm = $request->query('q', '');
            $limit = min($request->query('limit', 10), 50); // จำกัดไม่เกิน 50 รายการ
            
            if (strlen($searchTerm) < 2) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'Search term must be at least 2 characters'
                ]);
            }

            $customers = $this->autofillService->searchCustomers($searchTerm, $limit);
            
            return response()->json([
                'success' => true,
                'data' => $customers,
                'message' => 'Customers retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('AutofillController::searchCustomers error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to search customers: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดึงรายการ Pricing Request ที่เสร็จแล้ว
     * GET /api/v1/pricing/completed-requests
     */
    public function getCompletedPricingRequests(Request $request): JsonResponse
    {
        try {
            $limit = min($request->query('limit', 20), 100); // จำกัดไม่เกิน 100 รายการ
            
            $pricingRequests = $this->autofillService->getCompletedPricingRequests($limit);
            
            return response()->json([
                'success' => true,
                'data' => $pricingRequests,
                'message' => 'Completed pricing requests retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('AutofillController::getCompletedPricingRequests error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve pricing requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดึงข้อมูล Cascade Auto-fill สำหรับ Invoice
     * GET /api/v1/invoices/autofill/quotation/{id}
     */
    public function getQuotationAutofillForInvoice($quotationId): JsonResponse
    {
        try {
            $autofillData = $this->autofillService->getCascadeAutofillForInvoice($quotationId);
            
            return response()->json([
                'success' => true,
                'data' => $autofillData,
                'message' => 'Auto-fill data for invoice retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('AutofillController::getQuotationAutofillForInvoice error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve auto-fill data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดึงข้อมูล Cascade Auto-fill สำหรับ Receipt
     * GET /api/v1/receipts/autofill/invoice/{id}
     */
    public function getInvoiceAutofillForReceipt($invoiceId): JsonResponse
    {
        try {
            $autofillData = $this->autofillService->getCascadeAutofillForReceipt($invoiceId);
            
            return response()->json([
                'success' => true,
                'data' => $autofillData,
                'message' => 'Auto-fill data for receipt retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('AutofillController::getInvoiceAutofillForReceipt error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve auto-fill data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดึงข้อมูล Cascade Auto-fill สำหรับ Delivery Note
     * GET /api/v1/delivery-notes/autofill/receipt/{id}
     */
    public function getReceiptAutofillForDeliveryNote($receiptId): JsonResponse
    {
        try {
            $autofillData = $this->autofillService->getCascadeAutofillForDeliveryNote($receiptId);
            
            return response()->json([
                'success' => true,
                'data' => $autofillData,
                'message' => 'Auto-fill data for delivery note retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('AutofillController::getReceiptAutofillForDeliveryNote error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve auto-fill data: ' . $e->getMessage()
            ], 500);
        }
    }
}
