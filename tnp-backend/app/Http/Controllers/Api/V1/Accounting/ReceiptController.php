<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Helpers\AccountingHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Accounting\ApproveReceiptRequest;
use App\Http\Requests\V1\Accounting\CalculateVatRequest;
use App\Http\Requests\V1\Accounting\CreateReceiptFromPaymentRequest;
use App\Http\Requests\V1\Accounting\RejectReceiptRequest;
use App\Http\Requests\V1\Accounting\StoreReceiptRequest;
use App\Http\Requests\V1\Accounting\UpdateReceiptRequest;
use App\Http\Requests\V1\Accounting\UploadReceiptEvidenceRequest;
use App\Http\Resources\V1\Accounting\ReceiptResource;
use App\Services\Accounting\ReceiptService;
use App\Traits\ApiResponseHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    use ApiResponseHelper;

    protected $receiptService;

    public function __construct(ReceiptService $receiptService)
    {
        $this->receiptService = $receiptService;
        // SEC-01: Require authentication for all receipt endpoints
        $this->middleware('auth:sanctum');
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
                'type' => $request->query('type'),
                'receipt_type' => $request->query('receipt_type'),
                'customer_id' => $request->query('customer_id'),
                'payment_method' => $request->query('payment_method'),
                'date_from' => $request->query('date_from'),
                'date_to' => $request->query('date_to'),
            ];

            $perPage = AccountingHelper::sanitizePerPage($request->query('per_page', 20), 20, 50);
            $receipts = $this->receiptService->getList($filters, $perPage);

            return $this->successResponse($receipts, 'Receipts retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('ReceiptController::index', $e);
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
                'attachments',
            ])->findOrFail($id);

            return $this->successResponse(
                new ReceiptResource($receipt),
                'Receipt details retrieved successfully'
            );
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFoundResponse('Receipt');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('ReceiptController::show', $e);
        }
    }

    /**
     * สร้าง Receipt แบบ Manual
     * POST /api/v1/receipts
     */
    public function store(StoreReceiptRequest $request): JsonResponse
    {
        try {
            $createdBy = AccountingHelper::getCurrentUserId();
            $receipt = $this->receiptService->create($request->validated(), $createdBy);

            return $this->successResponse($receipt, 'Receipt created successfully', 201);
        } catch (\Exception $e) {
            return $this->serverErrorResponse('ReceiptController::store', $e);
        }
    }

    /**
     * แก้ไข Receipt
     * PUT /api/v1/receipts/{id}
     */
    public function update(UpdateReceiptRequest $request, $id): JsonResponse
    {
        try {
            $updatedBy = AccountingHelper::getCurrentUserId();
            $receipt = $this->receiptService->update($id, $request->validated(), $updatedBy);

            return $this->successResponse($receipt, 'Receipt updated successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('ReceiptController::update', $e);
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
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFoundResponse('Receipt');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('ReceiptController::destroy', $e);
        }
    }

    /**
     * สร้าง Receipt จาก Payment
     * POST /api/v1/receipts/create-from-payment
     */
    public function createFromPayment(CreateReceiptFromPaymentRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $createdBy = AccountingHelper::getCurrentUserId();
            $receipt = $this->receiptService->createFromPayment(
                $validated['invoice_id'],
                $validated,
                $createdBy
            );

            return $this->successResponse($receipt, 'Receipt created from payment successfully', 201);
        } catch (\Exception $e) {
            return $this->serverErrorResponse('ReceiptController::createFromPayment', $e);
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
            return $this->serverErrorResponse('ReceiptController::submit', $e);
        }
    }

    /**
     * อนุมัติใบเสร็จ
     * POST /api/v1/receipts/{id}/approve
     */
    public function approve(ApproveReceiptRequest $request, $id): JsonResponse
    {
        try {
            $notes = $request->validated()['notes'] ?? null;
            $approvedBy = AccountingHelper::getCurrentUserId();
            $receipt = $this->receiptService->approve($id, $approvedBy, $notes);

            return $this->successResponse($receipt, 'Receipt approved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('ReceiptController::approve', $e);
        }
    }

    /**
     * ปฏิเสธใบเสร็จ
     * POST /api/v1/receipts/{id}/reject
     */
    public function reject(RejectReceiptRequest $request, $id): JsonResponse
    {
        try {
            $reason = $request->validated()['reason'];
            $rejectedBy = AccountingHelper::getCurrentUserId();
            $receipt = $this->receiptService->reject($id, $reason, $rejectedBy);

            return $this->successResponse($receipt, 'Receipt rejected successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('ReceiptController::reject', $e);
        }
    }

    /**
     * อัปโหลดหลักฐานการชำระ
     * POST /api/v1/receipts/{id}/upload-evidence
     */
    public function uploadEvidence(UploadReceiptEvidenceRequest $request, $id): JsonResponse
    {
        try {
            $description = $request->validated()['description'] ?? null;
            $uploadedBy = AccountingHelper::getCurrentUserId();
            $result = $this->receiptService->uploadEvidence(
                $id,
                $request->file('files'),
                $description,
                $uploadedBy
            );

            return $this->successResponse($result, 'Evidence uploaded successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('ReceiptController::uploadEvidence', $e);
        }
    }

    /**
     * ดูข้อมูลการคำนวณ VAT
     * GET /api/v1/receipts/calculate-vat
     */
    public function calculateVat(CalculateVatRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $amount = $validated['amount'];
            $receiptType = $validated['type'] ?? $validated['receipt_type'] ?? null;

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
                    'has_vat' => true,
                ];
            } else {
                // ใบเสร็จธรรมดา (ไม่มี VAT)
                $calculation = [
                    'total_amount' => $amount,
                    'subtotal' => $amount,
                    'vat_rate' => 0,
                    'vat_amount' => 0,
                    'has_vat' => false,
                ];
            }

            return $this->successResponse($calculation, 'VAT calculation completed successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('ReceiptController::calculateVat', $e);
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
                    'has_vat' => false,
                ],
                [
                    'value' => 'tax_invoice',
                    'label' => 'ใบกำกับภาษี',
                    'description' => 'ใบกำกับภาษีสำหรับลูกค้าที่มีเลขภาษี',
                    'has_vat' => true,
                ],
                [
                    'value' => 'full_tax_invoice',
                    'label' => 'ใบกำกับภาษี/ใบเสร็จ',
                    'description' => 'ใบกำกับภาษีเต็มรูปแบบ',
                    'has_vat' => true,
                ],
            ];

            return $this->successResponse($types, 'Receipt types retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('ReceiptController::getReceiptTypes', $e);
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
                    'requires_bank' => false,
                ],
                [
                    'value' => 'transfer',
                    'label' => 'โอนเงิน',
                    'requires_reference' => true,
                    'requires_bank' => true,
                ],
                [
                    'value' => 'check',
                    'label' => 'เช็ค',
                    'requires_reference' => true,
                    'requires_bank' => true,
                ],
                [
                    'value' => 'credit_card',
                    'label' => 'บัตรเครดิต',
                    'requires_reference' => true,
                    'requires_bank' => false,
                ],
            ];

            return $this->successResponse($methods, 'Payment methods retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('ReceiptController::getPaymentMethods', $e);
        }
    }
}
