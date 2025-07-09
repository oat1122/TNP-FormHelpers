<?php

namespace App\Http\Controllers\Api\V1\MaxSupply;

use App\Http\Controllers\Controller;
use App\Http\Requests\MaxSupply\StoreMaxSupplyRequest;
use App\Http\Requests\MaxSupply\UpdateMaxSupplyRequest;
use App\Http\Requests\MaxSupply\StatusUpdateRequest;
use App\Http\Resources\MaxSupply\MaxSupplyResource;
use App\Http\Resources\MaxSupply\MaxSupplyCollection;
use App\Models\MaxSupply\MaxSupply;
use App\Services\MaxSupply\MaxSupplyService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MaxSupplyController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        private MaxSupplyService $maxSupplyService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = MaxSupply::with(['worksheet', 'creator'])
            ->orderBy('created_at', 'desc');

        // Filters
        if ($request->filled('production_type')) {
            $query->byProductionType($request->production_type);
        }

        if ($request->filled('status')) {
            $query->byStatus($request->status);
        }

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('customer_name', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->byDateRange($request->date_from, $request->date_to);
        }

        $maxSupplies = $query->paginate($request->get('per_page', 20));

        return new MaxSupplyCollection($maxSupplies);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreMaxSupplyRequest $request)
    {
        $maxSupply = $this->maxSupplyService->create($request->validated());

        return new MaxSupplyResource($maxSupply);
    }

    /**
     * Display the specified resource.
     */
    public function show(MaxSupply $maxSupply)
    {
        $maxSupply->load(['worksheet', 'screen', 'creator', 'activities.user']);

        return new MaxSupplyResource($maxSupply);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateMaxSupplyRequest $request, MaxSupply $maxSupply)
    {
        $maxSupply = $this->maxSupplyService->update($maxSupply, $request->validated());

        return new MaxSupplyResource($maxSupply);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MaxSupply $maxSupply)
    {
        $this->maxSupplyService->delete($maxSupply);

        return response()->json([
            'message' => 'งานถูกลบเรียบร้อยแล้ว'
        ], Response::HTTP_OK);
    }

    /**
     * Update the status of the specified resource.
     */
    public function updateStatus(StatusUpdateRequest $request, MaxSupply $maxSupply)
    {
        $maxSupply = $this->maxSupplyService->updateStatus(
            $maxSupply,
            $request->status,
            $request->completed_quantity
        );

        return new MaxSupplyResource($maxSupply);
    }
}
