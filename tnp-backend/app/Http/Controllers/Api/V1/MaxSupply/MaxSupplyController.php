<?php

namespace App\Http\Controllers\Api\V1\MaxSupply;

use App\Http\Controllers\Controller;
use App\Models\MaxSupply;
use App\Models\MaxSupplyLog;
use App\Http\Requests\MaxSupply\StoreMaxSupplyRequest;
use App\Http\Requests\MaxSupply\UpdateMaxSupplyRequest;
use App\Http\Resources\MaxSupply\MaxSupplyResource;
use App\Services\MaxSupplyService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MaxSupplyController extends Controller
{
    protected $maxSupplyService;

    public function __construct(MaxSupplyService $maxSupplyService)
    {
        $this->maxSupplyService = $maxSupplyService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 15);
            $status = $request->get('status');
            $priority = $request->get('priority');
            $search = $request->get('search');
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            $query = MaxSupply::with(['creator', 'updater', 'files'])
                ->orderBy('created_at', 'desc');

            // Apply filters
            if ($status) {
                $query->byStatus($status);
            }

            if ($priority) {
                $query->byPriority($priority);
            }

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('production_code', 'like', "%{$search}%")
                      ->orWhere('customer_name', 'like', "%{$search}%")
                      ->orWhere('product_name', 'like', "%{$search}%");
                });
            }

            if ($startDate && $endDate) {
                $query->byDateRange($startDate, $endDate);
            }

            $maxSupplies = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => MaxSupplyResource::collection($maxSupplies->items()),
                'meta' => [
                    'current_page' => $maxSupplies->currentPage(),
                    'last_page' => $maxSupplies->lastPage(),
                    'per_page' => $maxSupplies->perPage(),
                    'total' => $maxSupplies->total(),
                ],
                'message' => 'Max supplies retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve max supplies',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreMaxSupplyRequest $request): JsonResponse
    {
        try {
            $maxSupply = $this->maxSupplyService->create($request->validated());

            return response()->json([
                'success' => true,
                'data' => new MaxSupplyResource($maxSupply),
                'message' => 'Max supply created successfully'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create max supply',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(MaxSupply $maxSupply): JsonResponse
    {
        try {
            $maxSupply->load(['creator', 'updater', 'files', 'logs.user']);

            return response()->json([
                'success' => true,
                'data' => new MaxSupplyResource($maxSupply),
                'message' => 'Max supply retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve max supply',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateMaxSupplyRequest $request, MaxSupply $maxSupply): JsonResponse
    {
        try {
            $maxSupply = $this->maxSupplyService->update($maxSupply, $request->validated());

            return response()->json([
                'success' => true,
                'data' => new MaxSupplyResource($maxSupply),
                'message' => 'Max supply updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update max supply',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MaxSupply $maxSupply): JsonResponse
    {
        try {
            $this->maxSupplyService->delete($maxSupply);

            return response()->json([
                'success' => true,
                'message' => 'Max supply deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete max supply',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update status of the specified resource.
     */
    public function updateStatus(Request $request, MaxSupply $maxSupply): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pending,in_progress,completed,cancelled'
        ]);

        try {
            $maxSupply->updateStatus($request->status, auth()->id());

            return response()->json([
                'success' => true,
                'data' => new MaxSupplyResource($maxSupply->refresh()),
                'message' => 'Status updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get audit logs for the specified resource.
     */
    public function auditLogs(MaxSupply $maxSupply): JsonResponse
    {
        try {
            $logs = $maxSupply->logs()
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $logs,
                'message' => 'Audit logs retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve audit logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
