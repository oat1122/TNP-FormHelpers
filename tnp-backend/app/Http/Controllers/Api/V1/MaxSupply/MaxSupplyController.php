<?php

namespace App\Http\Controllers\Api\V1\MaxSupply;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreMaxSupplyRequest;
use App\Http\Requests\V1\UpdateMaxSupplyRequest;
use App\Http\Resources\V1\MaxSupply\MaxSupplyResource;
use App\Models\MaxSupply;
use App\Services\MaxSupplyService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class MaxSupplyController extends Controller
{
    public function __construct(
        private MaxSupplyService $maxSupplyService
    ) {}

    /**
     * รายการงานทั้งหมด
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Debug: Log all incoming parameters
            Log::info('MaxSupply index request parameters:', $request->all());
            
            $query = MaxSupply::with(['worksheet', 'creator']);
            
            // Handle sorting
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            
            // Validate sort fields to prevent SQL injection
            $allowedSortFields = [
                'created_at', 'updated_at', 'start_date', 'expected_completion_date', 
                'due_date', 'title', 'status', 'priority', 'production_type'
            ];
            
            if (in_array($sortBy, $allowedSortFields)) {
                $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
            } else {
                $query->orderBy('created_at', 'desc');
            }

            // Filters
            if ($request->filled('production_type') && $request->production_type !== 'all') {
                $query->byProductionType($request->production_type);
            }

            if ($request->filled('status') && $request->status !== 'all') {
                $query->byStatus($request->status);
            }

            if ($request->filled('priority') && $request->priority !== 'all') {
                $query->where('priority', $request->priority);
            }

            if ($request->filled('search')) {
                $search = '%' . $request->search . '%';
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', $search)
                      ->orWhere('customer_name', 'like', $search)
                      ->orWhere('code', 'like', $search);
                });
            }

            if ($request->filled('date_from') && $request->filled('date_to')) {
                // กรองตาม start_date (default)
                $dateType = $request->input('date_type', 'start_date');
                
                switch ($dateType) {
                    case 'completion_date':
                        $query->byCompletionDateRange($request->date_from, $request->date_to);
                        break;
                    case 'created_at':
                        $query->byCreatedDateRange($request->date_from, $request->date_to);
                        break;
                    case 'due_date':
                        $query->byDueDateRange($request->date_from, $request->date_to);
                        break;
                    case 'actual_completion_date':
                        $query->byActualCompletionDateRange($request->date_from, $request->date_to);
                        break;
                    case 'due_or_completion':
                        $query->byDueDateOrCompletionDate($request->date_from, $request->date_to);
                        break;
                    default:
                        $query->byDateRange($request->date_from, $request->date_to);
                        break;
                }
            }

            // Handle overdue and urgent filters (mutually exclusive)
            if ($request->boolean('overdue_only')) {
                $query->overdue();
            } elseif ($request->boolean('urgent_only')) {
                $query->urgent();
            }

            // Legacy support for 'overdue' parameter
            if ($request->filled('overdue') && $request->overdue === 'true') {
                $query->overdue();
            }

            $perPage = min($request->input('per_page', 10), 100); // จำกัดไม่เกิน 100
            $maxSupplies = $query->paginate($perPage);
            
            // Debug: Log query result count
            Log::info('MaxSupply query result count:', ['total' => $maxSupplies->total()]);

            return response()->json([
                'status' => 'success',
                'data' => MaxSupplyResource::collection($maxSupplies->items()),
                'meta' => [
                    'current_page' => $maxSupplies->currentPage(),
                    'per_page' => $maxSupplies->perPage(),
                    'last_page' => $maxSupplies->lastPage(),
                    'total' => $maxSupplies->total(),
                    'from' => $maxSupplies->firstItem(),
                    'to' => $maxSupplies->lastItem(),
                ],
                // เก็บ pagination key เก่าไว้เพื่อ backward compatibility
                'pagination' => [
                    'current_page' => $maxSupplies->currentPage(),
                    'per_page' => $maxSupplies->perPage(),
                    'total_pages' => $maxSupplies->lastPage(),
                    'total_items' => $maxSupplies->total()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get max supplies error: ' . $e->getMessage(), [
                'request_params' => $request->all(),
                'stack_trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get max supplies',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * สร้างงานใหม่
     */
    public function store(StoreMaxSupplyRequest $request): JsonResponse
    {
        try {
            $maxSupply = $this->maxSupplyService->create($request->validated());

            return response()->json([
                'status' => 'success',
                'message' => 'สร้างงานใหม่เรียบร้อยแล้ว',
                'data' => new MaxSupplyResource($maxSupply)
            ], 201);

        } catch (\Exception $e) {
            Log::error('Create max supply error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create max supply: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * รายละเอียดงาน
     */
    public function show(string $id): JsonResponse
    {
        try {
            $maxSupply = MaxSupply::with(['worksheet', 'creator', 'updater', 'activities.user'])
                ->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => new MaxSupplyResource($maxSupply)
            ]);

        } catch (\Exception $e) {
            Log::error('Get max supply detail error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Max supply not found'
            ], 404);
        }
    }

    /**
     * แก้ไขงาน
     */
    public function update(UpdateMaxSupplyRequest $request, string $id): JsonResponse
    {
        try {
            $maxSupply = MaxSupply::findOrFail($id);
            $maxSupply = $this->maxSupplyService->update($maxSupply, $request->validated());

            return response()->json([
                'status' => 'success',
                'message' => 'แก้ไขข้อมูลเรียบร้อยแล้ว',
                'data' => new MaxSupplyResource($maxSupply)
            ]);

        } catch (\Exception $e) {
            Log::error('Update max supply error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update max supply: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ลบงาน
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $maxSupply = MaxSupply::findOrFail($id);
            $this->maxSupplyService->delete($maxSupply);

            return response()->json([
                'status' => 'success',
                'message' => 'ลบงานเรียบร้อยแล้ว'
            ]);

        } catch (\Exception $e) {
            Log::error('Delete max supply error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete max supply'
            ], 500);
        }
    }

    /**
     * เปลี่ยนสถานะงาน
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'completed_quantity' => 'nullable|integer|min:0',
        ]);

        try {
            $maxSupply = MaxSupply::findOrFail($id);

            // Validate completed quantity
            if ($request->filled('completed_quantity') &&
                $request->completed_quantity > $maxSupply->total_quantity) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'จำนวนที่เสร็จต้องไม่เกินจำนวนทั้งหมด'
                ], 422);
            }

            $maxSupply = $this->maxSupplyService->updateStatus(
                $maxSupply,
                $request->status,
                $request->completed_quantity
            );

            return response()->json([
                'status' => 'success',
                'message' => 'เปลี่ยนสถานะเรียบร้อยแล้ว',
                'data' => new MaxSupplyResource($maxSupply)
            ]);

        } catch (\Exception $e) {
            Log::error('Update max supply status error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update status'
            ], 500);
        }
    }

    /**
     * ดึงข้อมูลสถิติ
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $query = MaxSupply::query();

            // Filter by date range if provided
            if ($request->filled('date_from') && $request->filled('date_to')) {
                // กรองตาม start_date (default) สำหรับ statistics
                $dateType = $request->input('date_type', 'start_date');
                
                switch ($dateType) {
                    case 'completion_date':
                        $query->byCompletionDateRange($request->date_from, $request->date_to);
                        break;
                    case 'created_at':
                        $query->byCreatedDateRange($request->date_from, $request->date_to);
                        break;
                    case 'due_date':
                        $query->byDueDateRange($request->date_from, $request->date_to);
                        break;
                    case 'actual_completion_date':
                        $query->byActualCompletionDateRange($request->date_from, $request->date_to);
                        break;
                    case 'due_or_completion':
                        $query->byDueDateOrCompletionDate($request->date_from, $request->date_to);
                        break;
                    default:
                        $query->byDateRange($request->date_from, $request->date_to);
                        break;
                }
            } else {
                // Default to current month
                $query->whereMonth('created_at', now()->month)
                      ->whereYear('created_at', now()->year);
            }

            $statistics = [
                'total' => $query->count(),
                'pending' => (clone $query)->byStatus('pending')->count(),
                'in_progress' => (clone $query)->byStatus('in_progress')->count(),
                'completed' => (clone $query)->byStatus('completed')->count(),
                'cancelled' => (clone $query)->byStatus('cancelled')->count(),
                'overdue' => (clone $query)->overdue()->count(),
                'production_types' => [
                    'screen' => (clone $query)->byProductionType('screen')->count(),
                    'dtf' => (clone $query)->byProductionType('dtf')->count(),
                    'sublimation' => (clone $query)->byProductionType('sublimation')->count(),
                ],
                'priorities' => [
                    'low' => (clone $query)->where('priority', 'low')->count(),
                    'normal' => (clone $query)->where('priority', 'normal')->count(),
                    'high' => (clone $query)->where('priority', 'high')->count(),
                    'urgent' => (clone $query)->where('priority', 'urgent')->count(),
                ]
            ];

            return response()->json([
                'status' => 'success',
                'data' => $statistics
            ]);

        } catch (\Exception $e) {
            Log::error('Get statistics error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get statistics'
            ], 500);
        }
    }
}
