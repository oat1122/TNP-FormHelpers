<?php

namespace App\Http\Controllers\Api\V1\MaxSupply;

use App\Http\Controllers\Controller;
use App\Http\Resources\MaxSupply\MobileResource;
use App\Services\MaxSupply\MobileService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MobileController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        private MobileService $mobileService
    ) {}

    /**
     * Get summary data for mobile.
     */
    public function summary(): JsonResponse
    {
        $data = $this->mobileService->getSummary();

        return response()->json($data);
    }

    /**
     * Get recent activities for mobile.
     */
    public function recentActivities(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 10);
        $data = $this->mobileService->getRecentActivities($limit);

        return response()->json($data);
    }

    /**
     * Get quick actions for mobile.
     */
    public function quickActions(): JsonResponse
    {
        $data = $this->mobileService->getQuickActions();

        return response()->json($data);
    }
}
