<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Helpers\AccountingHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Accounting\ApproveQuotationRequest;
use App\Http\Requests\V1\Accounting\CreateFromMultiplePricingRequestsRequest;
use App\Http\Requests\V1\Accounting\CreateFromPricingRequestRequest;
use App\Http\Requests\V1\Accounting\CreateStandaloneQuotationRequest;
use App\Http\Requests\V1\Accounting\MarkQuotationCompletedRequest;
use App\Http\Requests\V1\Accounting\MarkSentRequest;
use App\Http\Requests\V1\Accounting\RejectRequest;
use App\Http\Requests\V1\Accounting\SendEmailRequest;
use App\Http\Requests\V1\Accounting\StoreQuotationRequest;
use App\Http\Requests\V1\Accounting\UpdateQuotationRequest;
use App\Http\Requests\V1\Accounting\UploadQuotationEvidenceRequest;
use App\Http\Requests\V1\Accounting\UploadQuotationSampleImagesRequest;
use App\Http\Requests\V1\Accounting\UploadQuotationSampleImagesTempRequest;
use App\Http\Requests\V1\Accounting\UploadQuotationSignaturesRequest;
use App\Models\Accounting\Quotation;
use App\Services\Accounting\QuotationService;
use App\Traits\ApiResponseHelper;
use App\Traits\HandlesPdfGeneration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuotationController extends Controller
{
    use ApiResponseHelper, HandlesPdfGeneration;

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
                'signature_uploaded' => $request->query('signature_uploaded'),
                'only_mine' => $request->query('only_mine'),
            ];

            $perPage = AccountingHelper::sanitizePerPage($request->query('per_page', 15), 15, 50);
            $quotations = $this->quotationService->getList($filters, $perPage);

            return $this->successResponse($quotations, 'Quotations retrieved successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::index', $e);
        }
    }

    /**
     * สร้างใบเสนอราคาใหม่
     * POST /api/v1/quotations
     */
    public function store(StoreQuotationRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $createdBy = AccountingHelper::getCurrentUserId();

            if (! empty($data['pricing_request_id'])) {
                $additionalData = collect($data)->except(['pricing_request_id'])->toArray();
                $quotation = $this->quotationService->createFromPricingRequest(
                    $data['pricing_request_id'],
                    $additionalData,
                    $createdBy
                );
            } else {
                $quotation = $this->quotationService->create($data, $createdBy);
            }

            return $this->createdResponse($quotation, 'Quotation created successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::store', $e);
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
                'items',
            ])->findOrFail($id);

            return $this->successResponse($quotation, 'Quotation retrieved successfully');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFoundResponse('Quotation');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::show', $e);
        }
    }

    /**
     * อัปเดตใบเสนอราคา
     * PUT /api/v1/quotations/{id}
     */
    public function update(UpdateQuotationRequest $request, $id): JsonResponse
    {
        try {
            $data = $request->validated();
            $updatedBy = AccountingHelper::getCurrentUserId();
            $user = auth()->user();

            // Load quotation with invoices to check permissions
            $quotation = Quotation::with('invoices:id,number,status,quotation_id')->findOrFail($id);

            // Check if user can edit this quotation
            $permissionCheck = $quotation->canBeEditedBy($user);

            if (! $permissionCheck['can_edit']) {
                return response()->json([
                    'success' => false,
                    'message' => $permissionCheck['reason'],
                    'has_invoices' => $permissionCheck['invoice_count'] > 0,
                    'invoice_count' => $permissionCheck['invoice_count'],
                    'affected_invoices' => $permissionCheck['invoices'],
                ], 403);
            }

            // Auto-sync: every edit propagates to linked invoices via SyncService
            // (Quotation\ManagementService::update). The new flow requires the user
            // to revert status to draft via the Undo button before editing, which
            // already serves as the intent confirmation — so a separate
            // confirm-sync prompt would be redundant.
            $result = $this->quotationService->update($id, $data, $updatedBy, true);

            // Prepare response with sync info
            $response = [
                'success' => true,
                'message' => 'Quotation updated successfully',
            ];

            // Add data wrapper with quotation and sync info
            if (isset($result['sync_mode'])) {
                $response['data'] = [
                    'quotation' => $result['quotation'] ?? null,
                    'sync_mode' => $result['sync_mode'],
                    'sync_count' => $result['sync_count'] ?? 0,
                    'sync_job_id' => $result['sync_job_id'] ?? null,
                ];
            } else {
                $response['data'] = $result['quotation'] ?? $result;
            }

            return response()->json($response, 200);

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::update', $e);
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
            $deletedBy = AccountingHelper::getCurrentUserId();

            $this->quotationService->delete($id, $deletedBy, $reason);

            return $this->successResponse(null, 'Quotation deleted successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::destroy', $e);
        }
    }

    /**
     * ดึงข้อมูลใบเสนอราคาสำหรับทำสำเนา
     * GET /api/v1/quotations/{id}/duplicate-data
     */
    public function getDuplicateData(Request $request, $id): JsonResponse
    {
        try {
            // edit flow ส่ง ?preserve_signatures=1 เพื่อคงลายเซ็นไว้ให้แสดงในแท็บ "หลักฐาน"
            // duplicate flow (default) จะ clear signatures + reset status เป็น draft
            $preserve = filter_var(
                $request->query('preserve_signatures', false),
                FILTER_VALIDATE_BOOLEAN
            );

            $duplicateData = $this->quotationService->getDataForDuplication($id, $preserve);

            return $this->successResponse($duplicateData, 'Quotation data for duplication retrieved successfully');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFoundResponse('Quotation');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::getDuplicateData', $e);
        }
    }

    /**
     * ส่งใบเสนอราคาเพื่อขออนุมัติ
     * POST /api/v1/quotations/{id}/submit
     */
    public function submit($id): JsonResponse
    {
        try {
            $submittedBy = AccountingHelper::getCurrentUserId();
            $quotation = $this->quotationService->submitForReview($id, $submittedBy);

            return $this->successResponse($quotation, 'Quotation submitted for review successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::submit', $e);
        }
    }

    /**
     * อนุมัติใบเสนอราคา
     * POST /api/v1/quotations/{id}/approve
     */
    public function approve(ApproveQuotationRequest $request, $id): JsonResponse
    {
        try {
            $notes = $request->validated()['notes'] ?? null;
            $approvedBy = AccountingHelper::getCurrentUserId();

            $quotation = $this->quotationService->approve($id, $approvedBy, $notes);

            return $this->successResponse($quotation, 'Quotation approved successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::approve', $e);
        }
    }

    /**
     * ปฏิเสธใบเสนอราคา
     * POST /api/v1/quotations/{id}/reject
     */
    public function reject(RejectRequest $request, $id): JsonResponse
    {
        try {
            $reason = $request->input('reason');
            $rejectedBy = AccountingHelper::getCurrentUserId();

            $quotation = $this->quotationService->reject($id, $rejectedBy, $reason);

            return $this->successResponse($quotation, 'Quotation rejected successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::reject', $e);
        }
    }

    /**
     * สร้างใบเสนอราคาจาก Pricing Request (Auto-fill)
     * POST /api/v1/quotations/create-from-pricing
     */
    public function createFromPricingRequest(CreateFromPricingRequestRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $createdBy = AccountingHelper::getCurrentUserId();

            $pricingRequestId = $data['pricing_request_id'];
            $additionalData = collect($data)->except(['pricing_request_id'])->toArray();

            $quotation = $this->quotationService->createFromPricingRequest(
                $pricingRequestId,
                $additionalData,
                $createdBy
            );

            return $this->createdResponse($quotation, 'Quotation created from pricing request successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::createFromPricingRequest', $e);
        }
    }

    /**
     * สร้างใบเสนอราคาจากหลาย Pricing Requests (Multi-select)
     * POST /api/v1/quotations/create-from-multiple-pricing
     */
    public function createFromMultiplePricingRequests(CreateFromMultiplePricingRequestsRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $createdBy = AccountingHelper::getCurrentUserId();

            $quotation = $this->quotationService->createFromMultiplePricingRequests(
                $data['pricing_request_ids'],
                $data['customer_id'],
                $data,
                $createdBy
            );

            return $this->createdResponse($quotation, 'Quotation created from multiple pricing requests successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::createFromMultiplePricingRequests', $e);
        }
    }

    /**
     * สร้างใบเสนอราคาแบบ Standalone (ไม่ต้องอิง Pricing Request)
     * POST /api/v1/quotations/create-standalone
     */
    public function createStandalone(CreateStandaloneQuotationRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $createdBy = AccountingHelper::getCurrentUserId();

            $quotation = $this->quotationService->createStandalone($data, $createdBy);

            return $this->createdResponse(
                $quotation->load(['customer', 'company', 'items', 'creator']),
                'Quotation created successfully'
            );

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::createStandalone', $e);
        }
    }

    /**
     * ส่งกลับแก้ไข (Account ส่งกลับให้ Sales)
     * POST /api/v1/quotations/{id}/send-back
     */
    public function sendBack(RejectRequest $request, $id): JsonResponse
    {
        try {
            $reason = $request->input('reason');
            $actionBy = AccountingHelper::getCurrentUserId();

            $quotation = $this->quotationService->sendBackForEdit($id, $reason, $actionBy);

            return $this->successResponse($quotation, 'Quotation sent back for editing successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::sendBack', $e);
        }
    }

    /**
     * ยกเลิกการอนุมัติ (Account)
     * POST /api/v1/quotations/{id}/revoke-approval
     */
    public function revokeApproval(RejectRequest $request, $id): JsonResponse
    {
        try {
            $reason = $request->input('reason');
            $actionBy = AccountingHelper::getCurrentUserId();

            $quotation = $this->quotationService->revokeApproval($id, $reason, $actionBy);

            return $this->successResponse($quotation, 'Quotation approval revoked successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::revokeApproval', $e);
        }
    }

    /**
     * สร้างและบันทึก PDF (ใช้ mPDF เป็นหลัก)
     */
    public function generatePdf(Request $request, $id)
    {
        $options = $this->extractPdfOptions($request);

        return $this->generatePdfJsonResponse($this->quotationService, $id, $options);
    }

    /**
     * แสดง PDF ในเบราว์เซอร์ (ใช้ mPDF)
     */
    public function streamPdf(Request $request, $id)
    {
        $options = $this->extractPdfOptions($request);

        return $this->streamPdfResponse($this->quotationService, $id, $options);
    }

    /**
     * ดาวน์โหลด PDF
     */
    public function downloadPdf(Request $request, $id)
    {
        $options = $this->extractPdfOptions($request);
        $defaultFilename = 'quotation-'.$id.'.pdf';

        return $this->downloadPdfResponse($this->quotationService, $id, $options, $defaultFilename);
    }

    /**
     * ตรวจสอบสถานะระบบ PDF
     */
    public function checkPdfStatus()
    {
        return $this->checkPdfSystemStatusResponse($this->quotationService);
    }

    /**
     * ส่งอีเมลใบเสนอราคา
     * POST /api/v1/quotations/{id}/send-email
     */
    public function sendEmail(SendEmailRequest $request, $id): JsonResponse
    {
        try {
            $emailData = $request->validated();
            $sentBy = AccountingHelper::getCurrentUserId();

            $result = $this->quotationService->sendEmail($id, $emailData, $sentBy);

            return $this->successResponse($result, 'Email sent successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::sendEmail', $e);
        }
    }

    /**
     * อัปโหลดหลักฐานการส่ง
     * POST /api/v1/quotations/{id}/upload-evidence
     */
    public function uploadEvidence(UploadQuotationEvidenceRequest $request, $id): JsonResponse
    {
        try {
            $uploadedBy = AccountingHelper::getCurrentUserId();
            $description = $request->validated()['description'] ?? null;

            $result = $this->quotationService->uploadEvidence($id, $request->file('files'), $description, $uploadedBy);

            return $this->successResponse($result, 'Evidence uploaded successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::uploadEvidence', $e);
        }
    }

    /**
     * อัปโหลดรูปหลักฐานการเซ็น (images only) - เฉพาะใบเสนอราคา approved และผู้ใช้ role sale/admin เท่านั้น
     * POST /api/v1/quotations/{id}/upload-signatures
     */
    public function uploadSignatures(UploadQuotationSignaturesRequest $request, $id): JsonResponse
    {
        try {
            $user = auth()->user();
            $files = $request->file('files');

            $result = $this->quotationService->uploadSignatures($id, $files, $user->user_uuid ?? null);

            return $this->successResponse($result, 'อัปโหลดรูปหลักฐานการเซ็นเรียบร้อย');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::uploadSignatures', $e);
        }
    }

    /**
     * Upload sample images and append to quotation->sample_images
     * POST /api/v1/quotations/{id}/upload-sample-images
     */
    public function uploadSampleImages(UploadQuotationSampleImagesRequest $request, $id): JsonResponse
    {
        try {
            $user = auth()->user();
            $files = $request->file('files');

            $result = $this->quotationService->uploadSampleImages($id, $files, $user->user_uuid ?? null);

            return $this->successResponse($result, 'Sample images uploaded successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::uploadSampleImages', $e);
        }
    }

    /**
     * Upload sample images without binding to quotation (for create form)
     * POST /api/v1/quotations/upload-sample-images
     */
    public function uploadSampleImagesTemp(UploadQuotationSampleImagesTempRequest $request): JsonResponse
    {
        try {
            $files = $request->file('files');
            $user = auth()->user();

            $result = $this->quotationService->uploadSampleImagesNoBind($files, $user->user_uuid ?? null);

            return $this->successResponse($result, 'Sample images uploaded successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::uploadSampleImagesTemp', $e);
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
            if (! in_array($role, ['admin', 'sale'])) {
                return $this->errorResponse('คุณไม่มีสิทธิ์ลบรูปหลักฐานการเซ็น', 403);
            }

            $result = $this->quotationService->deleteSignatureImage($id, $identifier, $user->user_uuid ?? null);

            return $this->successResponse($result, 'ลบรูปหลักฐานการเซ็นเรียบร้อย');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::deleteSignatureImage', $e);
        }
    }

    /**
     * มาร์คว่าลูกค้าตอบรับแล้ว
     * POST /api/v1/quotations/{id}/mark-completed
     */
    public function markCompleted(MarkQuotationCompletedRequest $request, $id): JsonResponse
    {
        try {
            $data = $request->validated();
            $completedBy = AccountingHelper::getCurrentUserId();

            $quotation = $this->quotationService->markCompleted($id, $data, $completedBy);

            return $this->successResponse($quotation, 'Quotation marked as completed successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::markCompleted', $e);
        }
    }

    /**
     * บันทึกการส่งเอกสาร (อัปเดตสถานะเป็น 'sent')
     * POST /api/v1/quotations/{id}/mark-sent
     */
    public function markSent(MarkSentRequest $request, $id): JsonResponse
    {
        try {
            $data = $request->validated();
            $sentBy = AccountingHelper::getCurrentUserId();

            $quotation = $this->quotationService->markSent($id, $data, $sentBy);

            return $this->successResponse($quotation, 'Quotation marked as sent successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::markSent', $e);
        }
    }

    /**
     * ดึงรายการ Invoice ที่เชื่อมโยงกับ Quotation
     * GET /api/v1/quotations/{id}/related-invoices
     */
    public function getRelatedInvoices($id): JsonResponse
    {
        try {
            $quotation = Quotation::with('invoices:id,number,status,quotation_id')->findOrFail($id);

            return response()->json([
                'success' => true,
                'has_invoices' => $quotation->invoices->isNotEmpty(),
                'invoice_count' => $quotation->invoices->count(),
                'invoices' => $quotation->invoices->map(function ($inv) {
                    return [
                        'id' => $inv->id,
                        'number' => $inv->number,
                        'status' => $inv->status,
                    ];
                }),
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFoundResponse('Quotation');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::getRelatedInvoices', $e);
        }
    }

    /**
     * ดึงสถานะของ Sync Job
     * GET /api/v1/quotations/sync-jobs/{jobId}
     */
    public function getSyncJobStatus($jobId): JsonResponse
    {
        try {
            $job = \App\Models\Accounting\QuotationInvoiceSyncJob::with([
                'quotation:id,number',
                'startedBy:user_uuid,name',
            ])->findOrFail($jobId);

            $invoiceNumbers = $job->getAffectedInvoiceNumbers();
            $elapsedSeconds = $job->getElapsedSeconds();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $job->id,
                    'quotation_id' => $job->quotation_id,
                    'quotation_number' => $job->quotation->number ?? null,
                    'status' => $job->status,
                    'progress_percentage' => $job->getProgressPercentage(),
                    'progress_current' => $job->progress_current,
                    'progress_total' => $job->progress_total,
                    'affected_invoice_numbers' => $invoiceNumbers,
                    'started_by' => [
                        'id' => $job->startedBy->user_uuid ?? null,
                        'name' => $job->startedBy->name ?? null,
                    ],
                    'started_at' => $job->started_at,
                    'completed_at' => $job->completed_at,
                    'elapsed_seconds' => $elapsedSeconds,
                    'error_message' => $job->error_message,
                ],
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFoundResponse('Sync job');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationController::getSyncJobStatus', $e);
        }
    }
}
