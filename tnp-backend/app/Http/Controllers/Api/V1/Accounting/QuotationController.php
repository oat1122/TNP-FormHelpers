<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\QuotationService;
use App\Models\Accounting\Quotation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Traits\ApiResponseHelper;
use App\Traits\HandlesPdfGeneration;
use App\Helpers\AccountingHelper;
use App\Http\Requests\V1\Accounting\StoreQuotationRequest;
use App\Http\Requests\V1\Accounting\UpdateQuotationRequest;
use App\Http\Requests\V1\Accounting\CreateFromPricingRequestRequest;
use App\Http\Requests\V1\Accounting\CreateFromMultiplePricingRequestsRequest;
use App\Http\Requests\V1\Accounting\CreateStandaloneQuotationRequest;
use App\Http\Requests\V1\Accounting\RejectRequest;
use App\Http\Requests\V1\Accounting\MarkSentRequest;
use App\Http\Requests\V1\Accounting\SendEmailRequest;

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
                'signature_uploaded' => $request->query('signature_uploaded')
            ];

            $perPage = AccountingHelper::sanitizePerPage($request->query('per_page', 15), 15, 50);
            $quotations = $this->quotationService->getList($filters, $perPage);
            
            return $this->successResponse($quotations, 'Quotations retrieved successfully');

        } catch (\Exception $e) {
            Log::error('QuotationController::index error: ' . $e->getMessage());
            return $this->errorResponse('Failed to retrieve quotations: ' . $e->getMessage());
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

            if (!empty($data['pricing_request_id'])) {
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
            Log::error('QuotationController::store error: ' . $e->getMessage());
            return $this->errorResponse('Failed to create quotation: ' . $e->getMessage());
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
            
            return $this->successResponse($quotation, 'Quotation retrieved successfully');

        } catch (\Exception $e) {
            Log::error('QuotationController::show error: ' . $e->getMessage());
            return $this->errorResponse('Failed to retrieve quotation: ' . $e->getMessage(), 404);
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
            $userRole = $user->role;

            // Load quotation with invoices to check permissions
            $quotation = Quotation::with('invoices:id,number,status,quotation_id')->findOrFail($id);

            // Check if user can edit this quotation
            $permissionCheck = $quotation->canBeEditedBy($user);
            
            if (!$permissionCheck['can_edit']) {
                return response()->json([
                    'success' => false,
                    'message' => $permissionCheck['reason'],
                    'has_invoices' => $permissionCheck['invoice_count'] > 0,
                    'invoice_count' => $permissionCheck['invoice_count'],
                    'affected_invoices' => $permissionCheck['invoices']
                ], 403);
            }

            // If quotation has invoices and user is Admin/Account, require sync confirmation
            if ($permissionCheck['invoice_count'] > 0 && in_array($userRole, ['admin', 'account'])) {
                $confirmSync = $request->input('confirm_sync', false);
                
                if (!$confirmSync) {
                    return response()->json([
                        'success' => false,
                        'message' => 'ต้องยืนยันการซิงค์ข้อมูลกับใบแจ้งหนี้',
                        'requires_confirmation' => true,
                        'affected_invoices' => $quotation->invoices->map(function($inv) {
                            return [
                                'id' => $inv->id,
                                'number' => $inv->number,
                                'status' => $inv->status
                            ];
                        }),
                        'invoice_count' => $quotation->invoices->count()
                    ], 422);
                }
            }

            // Perform update with optional sync
            $result = $this->quotationService->update($id, $data, $updatedBy, $request->input('confirm_sync', false));
            
            // Prepare response with sync info
            $response = [
                'success' => true,
                'message' => 'Quotation updated successfully'
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
            Log::error('QuotationController::update error: ' . $e->getMessage(), [
                'quotation_id' => $id,
                'user_id' => AccountingHelper::getCurrentUserId(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse('Failed to update quotation: ' . $e->getMessage());
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
            Log::error('QuotationController::destroy error: ' . $e->getMessage());
            return $this->errorResponse('Failed to delete quotation: ' . $e->getMessage());
        }
    }

    /**
     * ดึงข้อมูลใบเสนอราคาสำหรับทำสำเนา
     * GET /api/v1/quotations/{id}/duplicate-data
     */
    public function getDuplicateData($id): JsonResponse
    {
        try {
            $duplicateData = $this->quotationService->getDataForDuplication($id);
            return $this->successResponse($duplicateData, 'Quotation data for duplication retrieved successfully');

        } catch (\Exception $e) {
            Log::error('QuotationController::getDuplicateData error: ' . $e->getMessage());
            return $this->errorResponse('Failed to retrieve quotation data for duplication: ' . $e->getMessage(), 404);
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
            Log::error('QuotationController::submit error: ' . $e->getMessage());
            return $this->errorResponse('Failed to submit quotation: ' . $e->getMessage());
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
            $approvedBy = AccountingHelper::getCurrentUserId();
            
            $quotation = $this->quotationService->approve($id, $approvedBy, $notes);
            
            return $this->successResponse($quotation, 'Quotation approved successfully');

        } catch (\Exception $e) {
            Log::error('QuotationController::approve error: ' . $e->getMessage());
            return $this->errorResponse('Failed to approve quotation: ' . $e->getMessage());
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
            Log::error('QuotationController::reject error: ' . $e->getMessage());
            return $this->errorResponse('Failed to reject quotation: ' . $e->getMessage());
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
                return $this->validationErrorResponse($validator->errors());
            }

            $additionalData = $validator->validated();
            $convertedBy = AccountingHelper::getCurrentUserId();
            
            $invoice = $this->quotationService->convertToInvoice($id, $convertedBy, $additionalData);
            
            return $this->successResponse($invoice, 'Quotation converted to invoice successfully');

        } catch (\Exception $e) {
            Log::error('QuotationController::convertToInvoice error: ' . $e->getMessage());
            return $this->errorResponse('Failed to convert quotation: ' . $e->getMessage());
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
            Log::error('QuotationController::createFromPricingRequest error: ' . $e->getMessage());
            return $this->errorResponse('Failed to create quotation from pricing request: ' . $e->getMessage());
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
            Log::error('QuotationController::createFromMultiplePricingRequests error: ' . $e->getMessage());
            return $this->errorResponse('Failed to create quotation from multiple pricing requests: ' . $e->getMessage());
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
            Log::error('QuotationController::createStandalone error: ' . $e->getMessage());
            return $this->errorResponse('Failed to create standalone quotation: ' . $e->getMessage());
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
            Log::error('QuotationController::sendBack error: ' . $e->getMessage());
            return $this->errorResponse('Failed to send back quotation: ' . $e->getMessage());
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
            Log::error('QuotationController::revokeApproval error: ' . $e->getMessage());
            return $this->errorResponse('Failed to revoke approval: ' . $e->getMessage());
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
        $defaultFilename = 'quotation-' . $id . '.pdf';
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
    public function sendEmail(SendEmailRequest $request, $id): JsonResponse
    {
        try {
            $emailData = $request->validated();
            $sentBy = AccountingHelper::getCurrentUserId();
            
            $result = $this->quotationService->sendEmail($id, $emailData, $sentBy);
            
            return $this->successResponse($result, 'Email sent successfully');

        } catch (\Exception $e) {
            Log::error('QuotationController::sendEmail error: ' . $e->getMessage());
            return $this->errorResponse('Failed to send email: ' . $e->getMessage());
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
                return $this->validationErrorResponse($validator->errors());
            }

            $uploadedBy = AccountingHelper::getCurrentUserId();
            $description = $request->input('description');
            
            $result = $this->quotationService->uploadEvidence($id, $request->file('files'), $description, $uploadedBy);
            
            return $this->successResponse($result, 'Evidence uploaded successfully');

        } catch (\Exception $e) {
            Log::error('QuotationController::uploadEvidence error: ' . $e->getMessage());
            return $this->errorResponse('Failed to upload evidence: ' . $e->getMessage());
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
                return $this->validationErrorResponse($validator->errors());
            }

            $user = auth()->user();
            $role = $user->role ?? null;
            if (!in_array($role, ['admin','sale'])) {
                return $this->errorResponse('คุณไม่มีสิทธิ์อัปโหลดหลักฐานการเซ็น', 403);
            }

            // รองรับ keys แบบ files[] จาก FormData
            $rawFiles = $request->file('files');
            // Normalise to array
            if ($rawFiles === null) {
                return $this->validationErrorResponse(['files' => ['No uploaded files found']]);
            }
            $files = is_array($rawFiles) ? $rawFiles : [$rawFiles];
            if (count($files) === 0) {
                return $this->validationErrorResponse(['files' => ['Empty files array']]);
            }

            $result = $this->quotationService->uploadSignatures($id, $files, $user->user_uuid ?? null);

            return $this->successResponse($result, 'อัปโหลดรูปหลักฐานการเซ็นเรียบร้อย');

        } catch (\Exception $e) {
            Log::error('QuotationController::uploadSignatures error: ' . $e->getMessage());
            return $this->errorResponse('Failed to upload signatures: ' . $e->getMessage());
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
                return $this->validationErrorResponse($validator->errors());
            }

            $user = auth()->user();
            $rawFiles = $request->file('files');
            if ($rawFiles === null) {
                return $this->validationErrorResponse(['files' => ['No uploaded files found']]);
            }
            $files = is_array($rawFiles) ? $rawFiles : [$rawFiles];

            $result = $this->quotationService->uploadSampleImages($id, $files, $user->user_uuid ?? null);

            return $this->successResponse($result, 'Sample images uploaded successfully');

        } catch (\Exception $e) {
            Log::error('QuotationController::uploadSampleImages error: ' . $e->getMessage());
            return $this->errorResponse('Failed to upload sample images: ' . $e->getMessage());
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
                return $this->errorResponse('คุณไม่มีสิทธิ์ลบรูปหลักฐานการเซ็น', 403);
            }

            $result = $this->quotationService->deleteSignatureImage($id, $identifier, $user->user_uuid ?? null);
            return $this->successResponse($result, 'ลบรูปหลักฐานการเซ็นเรียบร้อย');
        } catch (\Exception $e) {
            Log::error('QuotationController::deleteSignatureImage error: ' . $e->getMessage());
            return $this->errorResponse('Failed to delete signature image: ' . $e->getMessage());
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
                return $this->validationErrorResponse($validator->errors());
            }

            $data = $validator->validated();
            $completedBy = AccountingHelper::getCurrentUserId();
            
            $quotation = $this->quotationService->markCompleted($id, $data, $completedBy);
            
            return $this->successResponse($quotation, 'Quotation marked as completed successfully');

        } catch (\Exception $e) {
            Log::error('QuotationController::markCompleted error: ' . $e->getMessage());
            return $this->errorResponse('Failed to mark quotation as completed: ' . $e->getMessage());
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
            Log::error('QuotationController::markSent error: ' . $e->getMessage());
            return $this->errorResponse('Failed to mark quotation as sent: ' . $e->getMessage());
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
                'invoices' => $quotation->invoices->map(function($inv) {
                    return [
                        'id' => $inv->id,
                        'number' => $inv->number,
                        'status' => $inv->status
                    ];
                })
            ], 200);

        } catch (\Exception $e) {
            Log::error('QuotationController::getRelatedInvoices error: ' . $e->getMessage(), [
                'quotation_id' => $id
            ]);
            return $this->errorResponse('Failed to retrieve related invoices: ' . $e->getMessage(), 404);
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
                'startedBy:user_uuid,name'
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
                        'name' => $job->startedBy->name ?? null
                    ],
                    'started_at' => $job->started_at,
                    'completed_at' => $job->completed_at,
                    'elapsed_seconds' => $elapsedSeconds,
                    'error_message' => $job->error_message
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('QuotationController::getSyncJobStatus error: ' . $e->getMessage(), [
                'job_id' => $jobId
            ]);
            return $this->errorResponse('Failed to retrieve sync job status: ' . $e->getMessage(), 404);
        }
    }
}
