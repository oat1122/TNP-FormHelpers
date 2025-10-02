<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\DeliveryNoteService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class DeliveryNoteController extends Controller
{
    protected $deliveryNoteService;

    public function __construct(DeliveryNoteService $deliveryNoteService)
    {
        $this->deliveryNoteService = $deliveryNoteService;
    }

    /**
     * ดึงรายการ Delivery Notes พร้อม Filter
     * GET /api/v1/delivery-notes
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'search' => $request->query('search'),
                'status' => $request->query('status'),
                'delivery_method' => $request->query('delivery_method'),
                'customer_id' => $request->query('customer_id'),
                'courier_company' => $request->query('courier_company'),
                'date_from' => $request->query('date_from'),
                'date_to' => $request->query('date_to')
            ];

            $perPage = min($request->query('per_page', 20), 50);
            
            $deliveryNotes = $this->deliveryNoteService->getList($filters, $perPage);

            return response()->json([
                'success' => true,
                'data' => $deliveryNotes,
                'message' => 'Delivery notes retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::index error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve delivery notes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retrieve invoice items available for delivery note creation
     * GET /api/v1/delivery-notes/invoice-items
     */
    public function getInvoiceItems(Request $request): JsonResponse
    {
        try {
            $filters = [
                'search' => $request->query('search'),
                'invoice_status' => $request->query('invoice_status'),
                'company_id' => $request->query('company_id'),
                'customer_id' => $request->query('customer_id'),
                'invoice_id' => $request->query('invoice_id'),
            ];

            $perPage = min($request->query('per_page', 20), 50);
            $items = $this->deliveryNoteService->getInvoiceItemSources($filters, $perPage);

            return response()->json([
                'success' => true,
                'data' => $items,
                'message' => 'Invoice items for delivery retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::getInvoiceItems error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve invoice items for delivery: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retrieve invoices available for delivery note creation
     * GET /api/v1/delivery-notes/invoices
     */
    public function getInvoices(Request $request): JsonResponse
    {
        try {
            $filters = [
                'search' => $request->query('search'),
                'status' => $request->query('status', 'approved'), // Default to approved only
                'company_id' => $request->query('company_id'),
                'customer_id' => $request->query('customer_id'),
            ];

            $perPage = min($request->query('per_page', 20), 50);
            $invoices = $this->deliveryNoteService->getInvoiceSources($filters, $perPage);

            return response()->json([
                'success' => true,
                'data' => $invoices,
                'message' => 'Invoices for delivery retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::getInvoices error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve invoices for delivery: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retrieve delivery note details
     * GET /api/v1/delivery-notes/{id}
     */
    public function show($id): JsonResponse
    {
        try {
            $deliveryNote = \App\Models\Accounting\DeliveryNote::with([
                'receipt',
                'invoice',
                'invoiceItem',
                'customer',
                'creator',
                'deliveryPerson',
                'manager',
                'items',
                'documentHistory',
                'attachments'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $deliveryNote,
                'message' => 'Delivery note details retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::show error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve delivery note details: ' . $e->getMessage()
            ], 404);
        }
    }

    /**
     * สร้าง Delivery Note แบบ Manual
     * POST /api/v1/delivery-notes
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'company_id' => 'nullable|string|exists:companies,id',
                'invoice_id' => 'nullable|string|exists:invoices,id',
                'invoice_item_id' => 'nullable|string|exists:invoice_items,id',
                'invoice_number' => 'nullable|string|max:50',
                'customer_id' => 'nullable|string|exists:master_customers,cus_id',
                'customer_data_source' => 'nullable|in:master,delivery',
                'customer_company' => 'nullable|string|max:255',
                'customer_address' => 'nullable|string|max:500',
                'customer_zip_code' => 'nullable|string|max:10',
                'customer_tel_1' => 'nullable|string|max:50',
                'customer_firstname' => 'nullable|string|max:100',
                'customer_lastname' => 'nullable|string|max:100',
                'customer_snapshot' => 'nullable',
                'work_name' => 'nullable|string|max:255',
                'quantity' => 'nullable|string|max:50',
                'delivery_method' => 'nullable|in:self_delivery,courier,customer_pickup',
                'delivery_address' => 'nullable|string|max:500',
                'recipient_name' => 'nullable|string|max:255',
                'recipient_phone' => 'nullable|string|max:50',
                'delivery_date' => 'nullable|date',
                'courier_company' => 'nullable|string|max:100',
                'tracking_number' => 'nullable|string|max:100',
                'delivery_notes' => 'nullable|string|max:1000',
                'notes' => 'nullable|string|max:1000',
                'sender_company_id' => 'nullable|string|exists:companies,id',
                'manage_by' => 'nullable|integer|exists:users,user_id',
                'items' => 'sometimes|array',
                'items.*.sequence_order' => 'nullable|integer|min:1',
                'items.*.item_name' => 'required_with:items|string|max:255',
                'items.*.item_description' => 'nullable|string',
                'items.*.pattern' => 'nullable|string|max:255',
                'items.*.fabric_type' => 'nullable|string|max:255',
                'items.*.color' => 'nullable|string|max:255',
                'items.*.size' => 'nullable|string|max:255',
                'items.*.delivered_quantity' => 'nullable|integer|min:0',
                'items.*.unit' => 'nullable|string|max:50',
                'items.*.invoice_id' => 'nullable|string|exists:invoices,id',
                'items.*.invoice_item_id' => 'nullable|string|exists:invoice_items,id',
                'items.*.item_snapshot' => 'nullable',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $createdBy = auth()->user()->user_uuid ?? null;
            $deliveryNote = $this->deliveryNoteService->create($request->all(), $createdBy);

            return response()->json([
                'success' => true,
                'data' => $deliveryNote,
                'message' => 'Delivery note created successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::store error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create delivery note: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * แก้ไข Delivery Note
     * PUT /api/v1/delivery-notes/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'customer_company' => 'sometimes|string|max:255',
                'invoice_id' => 'sometimes|string|exists:invoices,id',
                'invoice_item_id' => 'sometimes|string|exists:invoice_items,id',
                'customer_address' => 'sometimes|string|max:500',
                'work_name' => 'sometimes|string|max:255',
                'delivery_method' => 'sometimes|in:self_delivery,courier,customer_pickup',
                'delivery_address' => 'sometimes|string|max:500',
                'recipient_name' => 'sometimes|string|max:255',
                'recipient_phone' => 'sometimes|string|max:50',
                'delivery_date' => 'sometimes|date|after_or_equal:today',
                'courier_company' => 'sometimes|string|max:100',
                'tracking_number' => 'sometimes|string|max:100',
                'delivery_notes' => 'sometimes|string|max:1000',
                'notes' => 'sometimes|string|max:1000',
                'customer_tel_1' => 'sometimes|string|max:50',
                'customer_firstname' => 'sometimes|string|max:255',
                'customer_lastname' => 'sometimes|string|max:255',
                'customer_tax_id' => 'sometimes|string|max:50',
                'customer_data_source' => 'sometimes|in:master,delivery',
                'customer_snapshot' => 'sometimes',
                'sender_company_id' => 'sometimes|string|exists:companies,id',
                'manage_by' => 'sometimes|integer|exists:users,user_id',
                // Items update support
                'items' => 'sometimes|array',
                'items.*.sequence_order' => 'nullable|integer|min:1',
                'items.*.item_name' => 'nullable|string|max:255',
                'items.*.item_description' => 'nullable|string|max:500',
                'items.*.pattern' => 'nullable|string|max:255',
                'items.*.fabric_type' => 'nullable|string|max:255',
                'items.*.color' => 'nullable|string|max:255',
                'items.*.size' => 'nullable|string|max:255',
                'items.*.delivered_quantity' => 'nullable|integer|min:0',
                'items.*.unit' => 'nullable|string|max:50',
                'items.*.invoice_id' => 'nullable|string|exists:invoices,id',
                'items.*.invoice_item_id' => 'nullable|string|exists:invoice_items,id',
                'items.*.item_snapshot' => 'nullable',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updatedBy = auth()->user()->user_uuid ?? null;
            $deliveryNote = $this->deliveryNoteService->update($id, $request->all(), $updatedBy);

            return response()->json([
                'success' => true,
                'data' => $deliveryNote,
                'message' => 'Delivery note updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::update error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update delivery note: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ลบ Delivery Note
     * DELETE /api/v1/delivery-notes/{id}
     */
    public function destroy($id): JsonResponse
    {
        try {
            $deliveryNote = \App\Models\Accounting\DeliveryNote::findOrFail($id);

            if ($deliveryNote->status !== 'preparing') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only delivery notes in preparing status can be deleted'
                ], 400);
            }

            $deliveryNote->delete();

            return response()->json([
                'success' => true,
                'message' => 'Delivery note deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::destroy error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete delivery note: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * สร้าง Delivery Note จาก Receipt
     * POST /api/v1/delivery-notes/create-from-receipt
     */
    public function createFromReceipt(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'receipt_id' => 'required|string|exists:receipts,id',
                'delivery_method' => 'required|in:self_delivery,courier,customer_pickup',
                'courier_company' => 'required_if:delivery_method,courier|string|max:100',
                'delivery_address' => 'nullable|string|max:500',
                'recipient_name' => 'nullable|string|max:255',
                'recipient_phone' => 'nullable|string|max:50',
                'delivery_date' => 'nullable|date|after_or_equal:today',
                'delivery_notes' => 'nullable|string|max:1000',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $createdBy = auth()->user()->user_uuid ?? null;
            $deliveryNote = $this->deliveryNoteService->createFromReceipt(
                $request->receipt_id,
                $request->all(),
                $createdBy
            );

            return response()->json([
                'success' => true,
                'data' => $deliveryNote,
                'message' => 'Delivery note created from receipt successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::createFromReceipt error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create delivery note from receipt: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * เริ่มการจัดส่ง
     * POST /api/v1/delivery-notes/{id}/start-shipping
     */
    public function startShipping(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'tracking_number' => 'nullable|string|max:100',
                'courier_company' => 'nullable|string|max:100',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $shippedBy = auth()->user()->user_uuid ?? null;
            $deliveryNote = $this->deliveryNoteService->startShipping($id, $request->all(), $shippedBy);

            return response()->json([
                'success' => true,
                'data' => $deliveryNote,
                'message' => 'Shipping started successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::startShipping error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to start shipping: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * อัปเดตสถานะการติดตาม
     * POST /api/v1/delivery-notes/{id}/update-tracking
     */
    public function updateTracking(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status_description' => 'required|string|max:255',
                'location' => 'nullable|string|max:255',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updatedBy = auth()->user()->user_uuid ?? null;
            $deliveryNote = $this->deliveryNoteService->updateTrackingStatus($id, $request->all(), $updatedBy);

            return response()->json([
                'success' => true,
                'data' => $deliveryNote,
                'message' => 'Tracking status updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::updateTracking error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update tracking status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ยืนยันการส่งสำเร็จ
     * POST /api/v1/delivery-notes/{id}/mark-delivered
     */
    public function markDelivered(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'recipient_name' => 'nullable|string|max:255',
                'delivery_notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $deliveredBy = auth()->user()->user_uuid ?? null;
            $deliveryNote = $this->deliveryNoteService->markAsDelivered($id, $request->all(), $deliveredBy);

            return response()->json([
                'success' => true,
                'data' => $deliveryNote,
                'message' => 'Delivery marked as successful'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::markDelivered error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark delivery as successful: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ปิดงาน
     * POST /api/v1/delivery-notes/{id}/mark-completed
     */
    public function markCompleted(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $completedBy = auth()->user()->user_uuid ?? null;
            $deliveryNote = $this->deliveryNoteService->markAsCompleted($id, $request->all(), $completedBy);

            return response()->json([
                'success' => true,
                'data' => $deliveryNote,
                'message' => 'Delivery marked as completed'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::markCompleted error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark delivery as completed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * รายงานปัญหา
     * POST /api/v1/delivery-notes/{id}/mark-failed
     */
    public function markFailed(Request $request, $id): JsonResponse
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

            $reportedBy = auth()->user()->user_uuid ?? null;
            $deliveryNote = $this->deliveryNoteService->markAsFailed($id, $request->all(), $reportedBy);

            return response()->json([
                'success' => true,
                'data' => $deliveryNote,
                'message' => 'Delivery marked as failed'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::markFailed error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark delivery as failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * อัปโหลดหลักฐานการจัดส่ง
     * POST /api/v1/delivery-notes/{id}/upload-evidence
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
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $uploadedBy = auth()->user()->user_uuid ?? null;
            $result = $this->deliveryNoteService->uploadEvidence(
                $id,
                $request->file('files'),
                $request->description,
                $uploadedBy
            );

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Evidence uploaded successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::uploadEvidence error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload evidence: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * สร้าง PDF ใบส่งของ
     * GET /api/v1/delivery-notes/{id}/generate-pdf
     */
    public function generatePdf($id): JsonResponse
    {
        try {
            $pdfData = $this->deliveryNoteService->generatePdf($id);

            return response()->json([
                'success' => true,
                'data' => $pdfData,
                'message' => 'PDF generated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::generatePdf error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดึง Timeline การจัดส่ง
     * GET /api/v1/delivery-notes/{id}/timeline
     */
    public function getTimeline($id): JsonResponse
    {
        try {
            $timeline = $this->deliveryNoteService->getDeliveryTimeline($id);

            return response()->json([
                'success' => true,
                'data' => $timeline,
                'message' => 'Delivery timeline retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::getTimeline error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve delivery timeline: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดึงรายการบริษัทขนส่ง
     * GET /api/v1/delivery-notes/courier-companies
     */
    public function getCourierCompanies(): JsonResponse
    {
        try {
            $companies = $this->deliveryNoteService->getCourierCompanies();

            return response()->json([
                'success' => true,
                'data' => $companies,
                'message' => 'Courier companies retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::getCourierCompanies error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve courier companies: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดึงรายการวิธีการจัดส่ง
     * GET /api/v1/delivery-notes/delivery-methods
     */
    public function getDeliveryMethods(): JsonResponse
    {
        try {
            $methods = $this->deliveryNoteService->getDeliveryMethods();

            return response()->json([
                'success' => true,
                'data' => $methods,
                'message' => 'Delivery methods retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::getDeliveryMethods error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve delivery methods: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดึงสถานะการจัดส่ง
     * GET /api/v1/delivery-notes/statuses
     */
    public function getDeliveryStatuses(): JsonResponse
    {
        try {
            $statuses = [
                [
                    'value' => 'preparing',
                    'label' => 'กำลังเตรียม',
                    'color' => '#6c757d',
                    'icon' => '📦',
                    'description' => 'กำลังเตรียมสินค้าสำหรับจัดส่ง'
                ],
                [
                    'value' => 'shipping',
                    'label' => 'กำลังจัดส่ง',
                    'color' => '#007bff',
                    'icon' => '🚚',
                    'description' => 'สินค้าออกจากคลังแล้ว'
                ],
                [
                    'value' => 'in_transit',
                    'label' => 'อยู่ระหว่างขนส่ง',
                    'color' => '#ffc107',
                    'icon' => '📍',
                    'description' => 'สินค้าอยู่ระหว่างขนส่ง'
                ],
                [
                    'value' => 'delivered',
                    'label' => 'ส่งแล้ว',
                    'color' => '#28a745',
                    'icon' => '✅',
                    'description' => 'ส่งถึงผู้รับเรียบร้อย'
                ],
                [
                    'value' => 'completed',
                    'label' => 'เสร็จสิ้น',
                    'color' => '#17a2b8',
                    'icon' => '🎉',
                    'description' => 'ปิดงานเรียบร้อย'
                ],
                [
                    'value' => 'failed',
                    'label' => 'ไม่สำเร็จ',
                    'color' => '#dc3545',
                    'icon' => '❌',
                    'description' => 'จัดส่งไม่สำเร็จ'
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $statuses,
                'message' => 'Delivery statuses retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('DeliveryNoteController::getDeliveryStatuses error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve delivery statuses: ' . $e->getMessage()
            ], 500);
        }
    }
}
