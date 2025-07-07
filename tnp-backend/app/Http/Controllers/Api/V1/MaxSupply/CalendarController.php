<?php

namespace App\Http\Controllers\Api\V1\MaxSupply;

use App\Http\Controllers\Controller;
use App\Services\MaxSupplyService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CalendarController extends Controller
{
    protected $maxSupplyService;

    public function __construct(MaxSupplyService $maxSupplyService)
    {
        $this->maxSupplyService = $maxSupplyService;
    }

    /**
     * Get calendar data for max supplies
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'start' => $request->get('start'),
                'end' => $request->get('end'),
                'status' => $request->get('status'),
                'search' => $request->get('search'),
            ];

            $calendarData = $this->maxSupplyService->getCalendarData($filters);

            return response()->json([
                'success' => true,
                'data' => $calendarData,
                'message' => 'Calendar data retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve calendar data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dashboard statistics
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = $this->maxSupplyService->getDashboardStats();

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Dashboard statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve dashboard statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
