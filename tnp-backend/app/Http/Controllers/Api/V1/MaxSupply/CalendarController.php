<?php

namespace App\Http\Controllers\Api\V1\MaxSupply;

use App\Http\Controllers\Controller;
use App\Services\CalendarService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class CalendarController extends Controller
{
    public function __construct(
        private CalendarService $calendarService
    ) {}

    /**
     * ข้อมูลปฏิทิน
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $view = $request->get('view', 'month'); // month, week, day
            $date = $request->get('date', now()->format('Y-m-d'));
            
            // Additional filter parameters
            $filters = [
                'status' => $request->get('status', 'all'),
                'production_type' => $request->get('production_type', 'all'),
                'priority' => $request->get('priority', 'all'),
            ];

            // Debug parameters
            Log::info('Calendar API index method called', [
                'view' => $view,
                'date' => $date,
                'filters' => $filters,
                'all_params' => $request->all(),
                'url' => $request->fullUrl(),
                'method' => $request->method()
            ]);

            $data = $this->calendarService->getCalendarData($view, $date, $filters);

            // Return JSON data with correct headers
            return response()->json([
                'status' => 'success',
                'message' => 'Calendar data retrieved successfully',
                'data' => $data
            ], 200, [
                'Content-Type' => 'application/json'
            ]);

        } catch (\Exception $e) {
            Log::error('Get calendar data error: ' . $e->getMessage());
            Log::error('Error trace: ' . $e->getTraceAsString());

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get calendar data: ' . $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * ข้อมูลรายเดือน
     */
    public function monthlyData(int $year, int $month): JsonResponse
    {
        try {
            $data = $this->calendarService->getMonthlyData($year, $month);

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);

        } catch (\Exception $e) {
            Log::error('Get monthly data error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get monthly data'
            ], 500);
        }
    }

    /**
     * ข้อมูลรายสัปดาห์
     */
    public function weeklyData(string $date): JsonResponse
    {
        try {
            $data = $this->calendarService->getWeeklyData($date);

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);

        } catch (\Exception $e) {
            Log::error('Get weekly data error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get weekly data'
            ], 500);
        }
    }

    /**
     * ข้อมูลรายวัน
     */
    public function dailyData(string $date): JsonResponse
    {
        try {
            $data = $this->calendarService->getDailyData($date);

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);

        } catch (\Exception $e) {
            Log::error('Get daily data error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get daily data'
            ], 500);
        }
    }
}
