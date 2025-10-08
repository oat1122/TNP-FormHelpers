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
    public function getCustomerDetails(Request $request, $customerId): JsonResponse
    {
        try {
            // 🔐 ดึงข้อมูล user ปัจจุบันสำหรับ access control
            $userInfo = null;
            if ($request->has('user') && $request->user) {
                $user = \App\Models\User::where('user_uuid', $request->user)
                    ->where('user_is_enable', true)
                    ->select('user_id', 'user_uuid', 'role')
                    ->first();
                
                if ($user) {
                    $userInfo = [
                        'user_id' => $user->user_id,
                        'user_uuid' => $user->user_uuid,
                        'role' => $user->role
                    ];
                }
            }

            // ส่ง userInfo ไป Service สำหรับ access control
            $customerData = $this->autofillService->getCustomerAutofillData($customerId, $userInfo);
            
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

            // 🔐 ดึงข้อมูล user ปัจจุบันสำหรับ access control
            $userInfo = null;
            if ($request->has('user') && $request->user) {
                $user = \App\Models\User::where('user_uuid', $request->user)
                    ->where('user_is_enable', true)
                    ->select('user_id', 'user_uuid', 'role')
                    ->first();
                
                if ($user) {
                    $userInfo = [
                        'user_id' => $user->user_id,
                        'user_uuid' => $user->user_uuid,
                        'role' => $user->role
                    ];
                }
            }

            // ส่ง userInfo ไป Service สำหรับ access control
            $customers = $this->autofillService->searchCustomers($searchTerm, $limit, $userInfo);
            
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
     * ดึงรายการ Pricing Request ที่เสร็จแล้ว (Step 0: Pricing Integration)
     * GET /api/v1/pricing/completed-requests
     */
    public function getCompletedPricingRequests(Request $request): JsonResponse
    {
        try {
            // Log request parameters for debugging
            Log::info('AutofillController::getCompletedPricingRequests called', [
                'params' => $request->all()
            ]);

            // 🔐 ดึงข้อมูล user ปัจจุบันสำหรับ access control
            $userInfo = null;
            if ($request->has('user') && $request->user) {
                $user = \App\Models\User::where('user_uuid', $request->user)
                    ->where('user_is_enable', true)
                    ->select('user_id', 'user_uuid', 'role')
                    ->first();
                
                if ($user) {
                    $userInfo = [
                        'user_id' => $user->user_id,
                        'user_uuid' => $user->user_uuid,
                        'role' => $user->role
                    ];
                }
            }

            // รองรับ filters ตาม specification
            $filters = [
                'search' => $request->query('search'),
                'customer_id' => $request->query('customer_id'),
                'date_from' => $request->query('date_from'),
                'date_to' => $request->query('date_to'),
                'work_name' => $request->query('work_name')
            ];

            $perPage = min($request->query('per_page', 20), 200); // เพิ่มสูงสุดเป็น 200 รายการ
            $page = max($request->query('page', 1), 1); // ตรวจสอบว่าหน้าไม่ต่ำกว่า 1
            
            // ส่ง userInfo ไป Service สำหรับ access control
            $completedRequests = $this->autofillService->getCompletedPricingRequests($filters, $perPage, $page, $userInfo);
            
            Log::info('AutofillController::getCompletedPricingRequests success', [
                'total_records' => $completedRequests->total(),
                'user_id' => $userInfo['user_id'] ?? 'guest',
                'access_control_applied' => $userInfo && $userInfo['user_id'] != 1
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $completedRequests->items(),
                'pagination' => [
                    'current_page' => $completedRequests->currentPage(),
                    'per_page' => $completedRequests->perPage(),
                    'total' => $completedRequests->total(),
                    'last_page' => $completedRequests->lastPage(),
                    'from' => $completedRequests->firstItem(),
                    'to' => $completedRequests->lastItem()
                ],
                'message' => 'Completed pricing requests retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('AutofillController::getCompletedPricingRequests error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve completed pricing requests: ' . $e->getMessage()
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

    /**
     * ดึงข้อมูล Notes ของ Pricing Request
     * GET /api/v1/pricing-requests/{id}/notes
     */
    public function getPricingRequestNotes($pricingRequestId): JsonResponse
    {
        try {
            $notes = $this->autofillService->getPricingRequestNotes($pricingRequestId);
            
            return response()->json([
                'success' => true,
                'data' => $notes,
                'message' => 'Pricing request notes retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('AutofillController::getPricingRequestNotes error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve pricing request notes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * มาร์ค Pricing Request ว่าใช้แล้วสำหรับสร้าง Quotation
     * POST /api/v1/pricing/requests/{id}/mark-used
     */
    public function markPricingRequestAsUsed(Request $request, $pricingRequestId): JsonResponse
    {
        try {
            $userId = auth()->user()->user_uuid ?? null;
            
            $result = $this->autofillService->markPricingRequestAsUsed($pricingRequestId, $userId);
            
            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Pricing request marked as used successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('AutofillController::markPricingRequestAsUsed error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark pricing request as used: ' . $e->getMessage()
            ], 500);
        }
    }
}
