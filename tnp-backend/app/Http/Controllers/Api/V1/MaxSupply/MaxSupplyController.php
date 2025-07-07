<?php

namespace App\Http\Controllers\Api\V1\MaxSupply;

use App\Http\Controllers\Controller;
use App\Http\Requests\MaxSupply\StoreMaxSupplyRequest;
use App\Http\Requests\MaxSupply\UpdateMaxSupplyRequest;
use App\Http\Resources\MaxSupply\MaxSupplyResource;
use App\Models\MaxSupply;
use App\Services\MaxSupplyService;
use Illuminate\Http\Request;

class MaxSupplyController extends Controller
{
    protected MaxSupplyService $service;

    public function __construct()
    {
        $this->service = new MaxSupplyService();
    }

    public function index()
    {
        return MaxSupplyResource::collection(MaxSupply::all());
    }

    public function store(StoreMaxSupplyRequest $request)
    {
        $maxSupply = $this->service->create($request->validated());
        return new MaxSupplyResource($maxSupply);
    }

    public function show(MaxSupply $maxSupply)
    {
        return new MaxSupplyResource($maxSupply);
    }

    public function update(UpdateMaxSupplyRequest $request, MaxSupply $maxSupply)
    {
        $maxSupply = $this->service->update($maxSupply, $request->validated());
        return new MaxSupplyResource($maxSupply);
    }

    public function destroy(MaxSupply $maxSupply)
    {
        $maxSupply->delete();
        return response()->noContent();
    }

    public function updateStatus(Request $request, MaxSupply $maxSupply)
    {
        $maxSupply->update(['status' => $request->input('status')]);
        return new MaxSupplyResource($maxSupply);
    }
}
