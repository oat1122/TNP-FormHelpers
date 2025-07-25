<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\DeliveryNoteService;
use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\Receipt;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class DeliveryNoteController extends Controller
{
    protected $deliveryNoteService;

    public function __construct(DeliveryNoteService $deliveryNoteService)
    {
        $this->deliveryNoteService = $deliveryNoteService;
    }

    /**
     * Display a listing of delivery notes
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'status' => $request->get('status'),
                'customer_id' => $request->get('customer_id'),
                'search' => $request->get('search'),
                'delivery_date_from' => $request->get('delivery_date_from'),
                'delivery_date_to' => $request->get('delivery_date_to'),
                'date_from' => $request->get('date_from'),
                'date_to' => $request->get('date_to'),
                'per_page' => $request->get('per_page', 15)
            ];

            $deliveryNotes = $this->deliveryNoteService->getDeliveryNotesList($filters);

            return response()->json([
                'status' => 'success',
                'message' => 'Delivery notes retrieved successfully',
                'data' => $deliveryNotes
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve delivery notes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created delivery note
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'receipt_id' => 'required|uuid|exists:receipts,id',
                'delivery_date' => 'required|date',
                'delivery_address' => 'nullable|string',
                'contact_person' => 'nullable|string|max:255',
                'contact_phone' => 'nullable|string|max:20',
                'remarks' => 'nullable|string',
                'items' => 'nullable|array',
                'items.*.quantity_delivered' => 'nullable|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $receipt = Receipt::findOrFail($request->receipt_id);

            if (!$this->deliveryNoteService->canCreateDeliveryNote($receipt)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot create delivery note from receipt in current status'
                ], 403);
            }
            
            $data = $request->all();
            $data['created_by'] = Auth::user()->user_uuid;

            $deliveryNote = $this->deliveryNoteService->createFromReceipt($receipt, $data);

            return response()->json([
                'status' => 'success',
                'message' => 'Delivery note created successfully',
                'data' => $deliveryNote
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create delivery note: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a partial delivery note
     */
    public function storePartial(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'receipt_id' => 'required|uuid|exists:receipts,id',
                'delivery_date' => 'required|date',
                'delivery_address' => 'nullable|string',
                'contact_person' => 'nullable|string|max:255',
                'contact_phone' => 'nullable|string|max:20',
                'remarks' => 'nullable|string',
                'items' => 'required|array|min:1',
                'items.*.item_name' => 'required|string|max:255',
                'items.*.item_description' => 'nullable|string',
                'items.*.quantity_ordered' => 'required|numeric|min:0.01',
                'items.*.quantity_delivered' => 'required|numeric|min:0.01',
                'items.*.unit' => 'nullable|string|max:50'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $receipt = Receipt::findOrFail($request->receipt_id);

            if (!$this->deliveryNoteService->canCreateDeliveryNote($receipt)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot create delivery note from receipt in current status'
                ], 403);
            }

            // Validate that delivered quantities don't exceed ordered quantities
            foreach ($request->items as $item) {
                if ($item['quantity_delivered'] > $item['quantity_ordered']) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Delivered quantity cannot exceed ordered quantity for item: ' . $item['item_name']
                    ], 422);
                }
            }
            
            $data = $request->all();
            $data['created_by'] = Auth::user()->user_uuid;

            $deliveryNote = $this->deliveryNoteService->createPartialDelivery($receipt, $data);

            return response()->json([
                'status' => 'success',
                'message' => 'Partial delivery note created successfully',
                'data' => $deliveryNote
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create partial delivery note: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified delivery note
     */
    public function show(string $id): JsonResponse
    {
        try {
            $deliveryNote = $this->deliveryNoteService->getDeliveryNoteWithRelations($id);

            if (!$deliveryNote) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Delivery note not found'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Delivery note retrieved successfully',
                'data' => $deliveryNote
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve delivery note: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified delivery note
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $deliveryNote = DeliveryNote::findOrFail($id);

            if (!$deliveryNote->canEdit()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Delivery note cannot be edited in current status'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'delivery_date' => 'nullable|date',
                'delivery_address' => 'nullable|string',
                'contact_person' => 'nullable|string|max:255',
                'contact_phone' => 'nullable|string|max:20',
                'remarks' => 'nullable|string',
                'items' => 'nullable|array',
                'items.*.quantity_delivered' => 'nullable|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();
            $data['updated_by'] = Auth::user()->user_uuid;

            $deliveryNote = $this->deliveryNoteService->updateDeliveryNote($deliveryNote, $data);

            return response()->json([
                'status' => 'success',
                'message' => 'Delivery note updated successfully',
                'data' => $deliveryNote
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update delivery note: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified delivery note
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $deliveryNote = DeliveryNote::findOrFail($id);

            if (!$deliveryNote->canEdit()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Delivery note cannot be deleted in current status'
                ], 403);
            }

            $deliveryNote->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Delivery note deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete delivery note: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change delivery note status
     */
    public function changeStatus(Request $request, string $id): JsonResponse
    {
        try {
            $deliveryNote = DeliveryNote::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:draft,pending_review,approved,rejected,completed,delivered',
                'remarks' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $newStatus = $request->status;
            $remarks = $request->remarks;
            $userId = Auth::user()->user_uuid;

            // Validate status transition
            if ($newStatus === 'approved' && !$deliveryNote->canApprove()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Delivery note cannot be approved in current status'
                ], 403);
            }

            $deliveryNote = $this->deliveryNoteService->changeStatus($deliveryNote, $newStatus, $userId, $remarks);

            return response()->json([
                'status' => 'success',
                'message' => 'Delivery note status updated successfully',
                'data' => $deliveryNote
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update delivery note status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending deliveries
     */
    public function getPending(): JsonResponse
    {
        try {
            $pendingDeliveries = $this->deliveryNoteService->getPendingDeliveries();

            return response()->json([
                'status' => 'success',
                'message' => 'Pending deliveries retrieved successfully',
                'data' => $pendingDeliveries
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve pending deliveries: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get delivery summary by customer
     */
    public function getCustomerSummary(Request $request, string $customerId): JsonResponse
    {
        try {
            $dateRange = [
                'from' => $request->get('date_from'),
                'to' => $request->get('date_to')
            ];

            $summary = $this->deliveryNoteService->getDeliverySummaryByCustomer($customerId, $dateRange);

            return response()->json([
                'status' => 'success',
                'message' => 'Customer delivery summary retrieved successfully',
                'data' => $summary
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve customer delivery summary: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate PDF for delivery note
     */
    public function generatePdf(string $id): JsonResponse
    {
        try {
            $deliveryNote = $this->deliveryNoteService->getDeliveryNoteWithRelations($id);

            if (!$deliveryNote) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Delivery note not found'
                ], 404);
            }

            // TODO: Implement PDF generation logic
            
            return response()->json([
                'status' => 'success',
                'message' => 'PDF generated successfully',
                'data' => [
                    'pdf_url' => url('api/v1/delivery-notes/' . $id . '/download-pdf')
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get delivery note history
     */
    public function getHistory(string $id): JsonResponse
    {
        try {
            $deliveryNote = DeliveryNote::with('statusHistory.user')->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'message' => 'Delivery note history retrieved successfully',
                'data' => $deliveryNote->statusHistory
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve delivery note history: ' . $e->getMessage()
            ], 500);
        }
    }
}
