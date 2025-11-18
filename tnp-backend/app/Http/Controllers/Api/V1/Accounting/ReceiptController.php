<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\ReceiptService;
use App\Traits\ApiResponseHelper;
use App\Helpers\AccountingHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ReceiptController extends Controller
{
    use ApiResponseHelper;

    protected $receiptService;

    public function __construct(ReceiptService $receiptService)
    {
        $this->receiptService = $receiptService;
    }

    /**
     * ดึงรายการ Receipt พร้อม Filter
     * GET /api/v1/receipts
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'search' => $request->query('search'),
                'status' => $request->query('status'),
                'receipt_type' => $request->query('receipt_type'),
                'customer_id' => $request->query('customer_id'),
                'payment_method' => $request->query('payment_method'),
                'date_from' => $request->query('date_from'),
                'date_to' => $request->query('date_to')
            ];

            $perPage = AccountingHelper::sanitizePerPage($request->query('per_page', 20), 20, 50);
            $receipts = $this->receiptService->getList($filters, $perPage);

            return $this->successResponse($receipts, 'Receipts retrieved successfully');
        } catch (\Exception $e) {
            Log::error('ReceiptController::index error: ' . $e->getMessage());
            return $this->errorResponse('Failed to retrieve receipts: ' . $e->getMessage());
        }
    }

    /**
     * ดูรายละเอียด Receipt
     * GET /api/v1/receipts/{id}
     */
    public function show($id): JsonResponse
    {
        try {
            $receipt = \App\Models\Accounting\Receipt::with([
                'invoice',
                'documentHistory',
                'documentAttachments'
            ])->findOrFail($id);

            return $this->successResponse($receipt, 'Receipt details retrieved successfully');
        } catch (\Exception $e) {
            Log::error('ReceiptController::show error: ' . $e->getMessage());
            return $this->notFoundResponse('Receipt');
        }
    }

    /**
     * สร้าง Receipt แบบ Manual
     * POST /api/v1/receipts
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'company_id' => 'nullable|string|exists:companies,id',
                'customer_company' => 'required|string|max:255',
                'customer_address' => 'required|string|max:500',
                'work_name' => 'required|string|max:255',
                'payment_amount' => 'required|numeric|min:0.01',
                'payment_date' => 'required|date',
                'payment_method' => 'required|in:cash,transfer,check,credit_card',
                'receipt_type' => 'required|in:receipt,tax_invoice,full_tax_invoice',
                'subtotal' => 'required|numeric|min:0',
                'vat_amount' => 'required|numeric|min:0',
                'total_amount' => 'required|numeric|min:0.01'
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $createdBy = AccountingHelper::getCurrentUserId();
            $receipt = $this->receiptService->create($request->all(), $createdBy);

            return $this->successResponse($receipt, 'Receipt created successfully', 201);
        } catch (\Exception $e) {
            Log::error('ReceiptController::store error: ' . $e->getMessage());
            return $this->errorResponse('Failed to create receipt: ' . $e->getMessage());
        }
    }

    /**
     * แก้ไข Receipt
     * PUT /api/v1/receipts/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'customer_company' => 'sometimes|string|max:255',
                'customer_address' => 'sometimes|string|max:500',
                'work_name' => 'sometimes|string|max:255',
                'payment_amount' => 'sometimes|numeric|min:0.01',
                'payment_date' => 'sometimes|date',
                'payment_method' => 'sometimes|in:cash,transfer,check,credit_card',
                'receipt_type' => 'sometimes|in:receipt,tax_invoice,full_tax_invoice',
                'subtotal' => 'sometimes|numeric|min:0',
                'vat_amount' => 'sometimes|numeric|min:0',
                'total_amount' => 'sometimes|numeric|min:0.01'
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $updatedBy = AccountingHelper::getCurrentUserId();
            $receipt = $this->receiptService->update($id, $request->all(), $updatedBy);

            return $this->successResponse($receipt, 'Receipt updated successfully');
        } catch (\Exception $e) {
            Log::error('ReceiptController::update error: ' . $e->getMessage());
            return $this->errorResponse('Failed to update receipt: ' . $e->getMessage());
        }
    }

    /**
     * ลบ Receipt
     * DELETE /api/v1/receipts/{id}
     */
    public function destroy($id): JsonResponse
    {
        try {
            $receipt = \App\Models\Accounting\Receipt::findOrFail($id);

            if ($receipt->status !== 'draft') {
                return $this->errorResponse('Only draft receipts can be deleted', 400);
            }

            $receipt->delete();
            return $this->successResponse(null, 'Receipt deleted successfully');
        } catch (\Exception $e) {
            Log::error('ReceiptController::destroy error: ' . $e->getMessage());
            return $this->errorResponse('Failed to delete receipt: ' . $e->getMessage());
        }
    }

    /**
     * สร้าง Receipt จาก Payment
     * POST /api/v1/receipts/create-from-payment
     */
    public function createFromPayment(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'invoice_id' => 'required|string|exists:invoices,id',
                'amount' => 'required|numeric|min:0.01',
                'payment_date' => 'required|date',
                'payment_method' => 'required|in:cash,transfer,check,credit_card',
                'receipt_type' => 'nullable|in:receipt,tax_invoice,full_tax_invoice',
                'reference_number' => 'nullable|string|max:100',
                'bank_name' => 'nullable|string|max:100',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $createdBy = AccountingHelper::getCurrentUserId();
            $receipt = $this->receiptService->createFromPayment(
                $request->invoice_id,
                $request->all(),
                $createdBy
            );

            return $this->successResponse($receipt, 'Receipt created from payment successfully', 201);
        } catch (\Exception $e) {
            Log::error('ReceiptController::createFromPayment error: ' . $e->getMessage());
            return $this->errorResponse('Failed to create receipt from payment: ' . $e->getMessage());
        }
    }

    /**
     * ส่งใบเสร็จเพื่อขออนุมัติ
     * POST /api/v1/receipts/{id}/submit
     */
    public function submit($id): JsonResponse
    {
        try {
            $submittedBy = AccountingHelper::getCurrentUserId();
            $receipt = $this->receiptService->submit($id, $submittedBy);
            return $this->successResponse($receipt, 'Receipt submitted for approval successfully');
        } catch (\Exception $e) {
            Log::error('ReceiptController::submit error: ' . $e->getMessage());
            return $this->errorResponse('Failed to submit receipt: ' . $e->getMessage());
        }
    }

    /**
     * อนุมัติใบเสร็จ
     * POST /api/v1/receipts/{id}/approve
     */
    public function approve(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $approvedBy = AccountingHelper::getCurrentUserId();
            $receipt = $this->receiptService->approve($id, $approvedBy, $request->notes);

            return $this->successResponse($receipt, 'Receipt approved successfully');
        } catch (\Exception $e) {
            Log::error('ReceiptController::approve error: ' . $e->getMessage());
            return $this->errorResponse('Failed to approve receipt: ' . $e->getMessage());
        }
    }

    /**
     * ปฏิเสธใบเสร็จ
     * POST /api/v1/receipts/{id}/reject
     */
    public function reject(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:1000'
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $rejectedBy = AccountingHelper::getCurrentUserId();
            $receipt = $this->receiptService->reject($id, $request->reason, $rejectedBy);

            return $this->successResponse($receipt, 'Receipt rejected successfully');
        } catch (\Exception $e) {
            Log::error('ReceiptController::reject error: ' . $e->getMessage());
            return $this->errorResponse('Failed to reject receipt: ' . $e->getMessage());
        }
    }

    /**
     * อัปโหลดหลักฐานการชำระ
     * POST /api/v1/receipts/{id}/upload-evidence
     */
    public function uploadEvidence(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'files' => 'required|array|min:1',
                'files.*' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120', // 5MB max
                'description' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $uploadedBy = AccountingHelper::getCurrentUserId();
            $result = $this->receiptService->uploadEvidence(
                $id,
                $request->file('files'),
                $request->description,
                $uploadedBy
            );

            return $this->successResponse($result, 'Evidence uploaded successfully');
        } catch (\Exception $e) {
            Log::error('ReceiptController::uploadEvidence error: ' . $e->getMessage());
            return $this->errorResponse('Failed to upload evidence: ' . $e->getMessage());
        }
    }

    /**
     * สร้าง PDF ใบเสร็จ/ใบกำกับภาษี
     * GET /api/v1/receipts/{id}/generate-pdf
     */
    public function generatePdf($id): JsonResponse
    {
        try {
            $pdfData = $this->receiptService->generatePdf($id);
            return $this->successResponse($pdfData, 'PDF generated successfully');
        } catch (\Exception $e) {
            Log::error('ReceiptController::generatePdf error: ' . $e->getMessage());
            return $this->errorResponse('Failed to generate PDF: ' . $e->getMessage());
        }
    }

    /**
     * ดูข้อมูลการคำนวณ VAT
     * GET /api/v1/receipts/calculate-vat
     */
    public function calculateVat(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:0.01',
                'receipt_type' => 'required|in:receipt,tax_invoice,full_tax_invoice'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $amount = $request->amount;
            $receiptType = $request->receipt_type;

            if (in_array($receiptType, ['tax_invoice', 'full_tax_invoice'])) {
                // คำนวณ VAT 7% (ราคารวม VAT แล้ว)
                $vatRate = 0.07;
                $subtotal = $amount / (1 + $vatRate);
                $vatAmount = $amount - $subtotal;

                $calculation = [
                    'total_amount' => $amount,
                    'subtotal' => round($subtotal, 2),
                    'vat_rate' => $vatRate,
                    'vat_amount' => round($vatAmount, 2),
                    'has_vat' => true
                ];
            } else {
                // ใบเสร็จธรรมดา (ไม่มี VAT)
                $calculation = [
                    'total_amount' => $amount,
                    'subtotal' => $amount,
                    'vat_rate' => 0,
                    'vat_amount' => 0,
                    'has_vat' => false
                ];
            }

            return $this->successResponse($calculation, 'VAT calculation completed successfully');
        } catch (\Exception $e) {
            Log::error('ReceiptController::calculateVat error: ' . $e->getMessage());
            return $this->errorResponse('Failed to calculate VAT: ' . $e->getMessage());
        }
    }

    /**
     * ดึงรายการประเภทใบเสร็จ
     * GET /api/v1/receipts/types
     */
    public function getReceiptTypes(): JsonResponse
    {
        try {
            $types = [
                [
                    'value' => 'receipt',
                    'label' => 'ใบเสร็จธรรมดา',
                    'description' => 'ใบเสร็จสำหรับลูกค้าที่ไม่มีเลขภาษี',
                    'has_vat' => false
                ],
                [
                    'value' => 'tax_invoice',
                    'label' => 'ใบกำกับภาษี',
                    'description' => 'ใบกำกับภาษีสำหรับลูกค้าที่มีเลขภาษี',
                    'has_vat' => true
                ],
                [
                    'value' => 'full_tax_invoice',
                    'label' => 'ใบกำกับภาษี/ใบเสร็จ',
                    'description' => 'ใบกำกับภาษีเต็มรูปแบบ',
                    'has_vat' => true
                ]
            ];

            return $this->successResponse($types, 'Receipt types retrieved successfully');
        } catch (\Exception $e) {
            Log::error('ReceiptController::getReceiptTypes error: ' . $e->getMessage());
            return $this->errorResponse('Failed to retrieve receipt types: ' . $e->getMessage());
        }
    }

    /**
     * ดึงรายการวิธีการชำระเงิน
     * GET /api/v1/receipts/payment-methods
     */
    public function getPaymentMethods(): JsonResponse
    {
        try {
            $methods = [
                [
                    'value' => 'cash',
                    'label' => 'เงินสด',
                    'requires_reference' => false,
                    'requires_bank' => false
                ],
                [
                    'value' => 'transfer',
                    'label' => 'โอนเงิน',
                    'requires_reference' => true,
                    'requires_bank' => true
                ],
                [
                    'value' => 'check',
                    'label' => 'เช็ค',
                    'requires_reference' => true,
                    'requires_bank' => true
                ],
                [
                    'value' => 'credit_card',
                    'label' => 'บัตรเครดิต',
                    'requires_reference' => true,
                    'requires_bank' => false
                ]
            ];

            return $this->successResponse($methods, 'Payment methods retrieved successfully');
        } catch (\Exception $e) {
            Log::error('ReceiptController::getPaymentMethods error: ' . $e->getMessage());
            return $this->errorResponse('Failed to retrieve payment methods: ' . $e->getMessage());
        }
    }
}
