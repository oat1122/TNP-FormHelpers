<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\AutofillService;
use App\Traits\ApiResponseHelper;
use App\Helpers\AccountingHelper;
use App\Http\Requests\V1\Accounting\BulkAutofillRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class AutofillController extends Controller
{
    use ApiResponseHelper;

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
            return $this->successResponse($autofillData, 'Auto-fill data retrieved successfully');
        } catch (\Exception $e) {
            Log::error('AutofillController::getPricingRequestAutofill error: ' . $e->getMessage());
            return $this->errorResponse('Failed to retrieve auto-fill data: ' . $e->getMessage());
        }
    }

    /**
     * 🔄 ดึงข้อมูล Auto-fill จาก Pricing Request หลายรายการพร้อมกัน (Bulk)
     * POST /api/v1/pricing-requests/bulk-autofill
     * 
     * @param BulkAutofillRequest $request Body: { "ids": [1, 2, 3] }
     * @return JsonResponse
     */
    public function getBulkPricingRequestAutofill(BulkAutofillRequest $request): JsonResponse
    {
        try {
            $prIds = $request->validated()['ids'];
            
            // ดึงข้อมูล autofill ทั้งหมดพร้อมกัน
            $results = [];
            foreach ($prIds as $prId) {
                try {
                    $autofillData = $this->autofillService->getAutofillDataFromPricingRequest($prId);
                    $results[] = array_merge(['pr_id' => $prId], $autofillData);
                } catch (\Exception $e) {
                    Log::warning("Failed to get autofill for PR {$prId}: " . $e->getMessage());
                }
            }
            
            return $this->successResponseWithMeta(
                $results,
                ['total' => count($results), 'requested' => count($prIds)],
                'Bulk auto-fill data retrieved successfully'
            );
        } catch (\Exception $e) {
            Log::error('AutofillController::getBulkPricingRequestAutofill error: ' . $e->getMessage());
            return $this->errorResponse('Failed to retrieve bulk auto-fill data: ' . $e->getMessage());
        }
    }

    /**
     * ดึงข้อมูลลูกค้าสำหรับ Auto-fill
     * GET /api/v1/customers/{id}/details
     */
    public function getCustomerDetails(Request $request, $customerId): JsonResponse
    {
        try {
            $userInfo = AccountingHelper::getUserInfoFromRequest($request);
            $customerData = $this->autofillService->getCustomerAutofillData($customerId, $userInfo);
            return $this->successResponse($customerData, 'Customer details retrieved successfully');
        } catch (\Exception $e) {
            Log::error('AutofillController::getCustomerDetails error: ' . $e->getMessage());
            return $this->errorResponse('Failed to retrieve customer details: ' . $e->getMessage());
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
            $limit = min($request->query('limit', 10), 50);
            
            if (strlen($searchTerm) < 2) {
                return $this->successResponse([], 'Search term must be at least 2 characters');
            }

            $userInfo = AccountingHelper::getUserInfoFromRequest($request);
            $customers = $this->autofillService->searchCustomers($searchTerm, $limit, $userInfo);
            
            return $this->successResponse($customers, 'Customers retrieved successfully');
        } catch (\Exception $e) {
            Log::error('AutofillController::searchCustomers error: ' . $e->getMessage());
            return $this->errorResponse('Failed to search customers: ' . $e->getMessage());
        }
    }

    /**
     * ดึงรายการ Pricing Request ที่เสร็จแล้ว (Step 0: Pricing Integration)
     * GET /api/v1/pricing/completed-requests
     */
    public function getCompletedPricingRequests(Request $request): JsonResponse
    {
        try {
            Log::info('AutofillController::getCompletedPricingRequests called', ['params' => $request->all()]);

            $userInfo = AccountingHelper::getUserInfoFromRequest($request);

            $filters = [
                'search' => $request->query('search'),
                'customer_id' => $request->query('customer_id'),
                'date_from' => $request->query('date_from'),
                'date_to' => $request->query('date_to'),
                'work_name' => $request->query('work_name')
            ];

            $perPage = AccountingHelper::sanitizePerPage($request->query('per_page', 20), 20, 200);
            $page = AccountingHelper::sanitizePage($request->query('page', 1));
            
            $completedRequests = $this->autofillService->getCompletedPricingRequests($filters, $perPage, $page, $userInfo);
            
            Log::info('AutofillController::getCompletedPricingRequests success', [
                'total_records' => $completedRequests->total(),
                'user_id' => $userInfo['user_id'] ?? 'guest',
                'access_control_applied' => $userInfo && $userInfo['user_id'] != 1
            ]);
            
            $pagination = AccountingHelper::getPaginationMetadata($completedRequests);
            return $this->successResponseWithPagination(
                $completedRequests->items(),
                $pagination,
                'Completed pricing requests retrieved successfully'
            );
        } catch (\Exception $e) {
            Log::error('AutofillController::getCompletedPricingRequests error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse('Failed to retrieve completed pricing requests: ' . $e->getMessage());
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
            return $this->successResponse($autofillData, 'Auto-fill data for invoice retrieved successfully');
        } catch (\Exception $e) {
            Log::error('AutofillController::getQuotationAutofillForInvoice error: ' . $e->getMessage());
            return $this->errorResponse('Failed to retrieve auto-fill data: ' . $e->getMessage());
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
            return $this->successResponse($autofillData, 'Auto-fill data for receipt retrieved successfully');
        } catch (\Exception $e) {
            Log::error('AutofillController::getInvoiceAutofillForReceipt error: ' . $e->getMessage());
            return $this->errorResponse('Failed to retrieve auto-fill data: ' . $e->getMessage());
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
            return $this->successResponse($autofillData, 'Auto-fill data for delivery note retrieved successfully');
        } catch (\Exception $e) {
            Log::error('AutofillController::getReceiptAutofillForDeliveryNote error: ' . $e->getMessage());
            return $this->errorResponse('Failed to retrieve auto-fill data: ' . $e->getMessage());
        }
    }

    /**
     * ดึงข้อมูล Notes ของ Pricing Request
     * GET /api/v1/pricing-requests/{id}/notes
     */
    public function getPricingRequestNotes($pricingRequestId): JsonResponse
    {
        try {
            $notes = $this->autofillService->getPricingRequestNotes($pricingRequestId);
            return $this->successResponse($notes, 'Pricing request notes retrieved successfully');
        } catch (\Exception $e) {
            Log::error('AutofillController::getPricingRequestNotes error: ' . $e->getMessage());
            return $this->errorResponse('Failed to retrieve pricing request notes: ' . $e->getMessage());
        }
    }

    /**
     * มาร์ค Pricing Request ว่าใช้แล้วสำหรับสร้าง Quotation
     * POST /api/v1/pricing/requests/{id}/mark-used
     */
    public function markPricingRequestAsUsed(Request $request, $pricingRequestId): JsonResponse
    {
        try {
            $userId = AccountingHelper::getCurrentUserId();
            $result = $this->autofillService->markPricingRequestAsUsed($pricingRequestId, $userId);
            return $this->successResponse($result, 'Pricing request marked as used successfully');
        } catch (\Exception $e) {
            Log::error('AutofillController::markPricingRequestAsUsed error: ' . $e->getMessage());
            return $this->errorResponse('Failed to mark pricing request as used: ' . $e->getMessage());
        }
    }
}
