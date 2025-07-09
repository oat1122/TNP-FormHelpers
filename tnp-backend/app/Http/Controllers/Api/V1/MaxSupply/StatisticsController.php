<?php

namespace App\Http\Controllers\Api\V1\MaxSupply;

use App\Http\Controllers\Controller;
use App\Services\MaxSupply\StatisticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StatisticsController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        private StatisticsService $statisticsService
    ) {}

    /**
     * Get dashboard statistics.
     */
    public function dashboard(): JsonResponse
    {
        $data = $this->statisticsService->getDashboardStats();

        return response()->json($data);
    }

    /**
     * Get production type statistics.
     */
    public function productionTypes(): JsonResponse
    {
        $data = $this->statisticsService->getProductionTypeStats();

        return response()->json($data);
    }

    /**
     * Get monthly statistics.
     */
    public function monthly(int $year, int $month): JsonResponse
    {
        $data = $this->statisticsService->getMonthlyStats($year, $month);

        return response()->json($data);
    }
}
