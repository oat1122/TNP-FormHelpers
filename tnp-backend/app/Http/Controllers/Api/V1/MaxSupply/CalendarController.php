<?php

namespace App\Http\Controllers\Api\V1\MaxSupply;

use App\Http\Controllers\Controller;
use App\Http\Resources\MaxSupply\CalendarResource;
use App\Services\MaxSupply\CalendarService;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        private CalendarService $calendarService
    ) {}

    /**
     * Get calendar data with optional view type and date.
     */
    public function index(Request $request)
    {
        $view = $request->get('view', 'month'); // month, week, day
        $date = $request->get('date', now()->format('Y-m-d'));

        $data = $this->calendarService->getCalendarData($view, $date);

        return new CalendarResource($data);
    }

    /**
     * Get monthly calendar data.
     */
    public function monthlyData(int $year, int $month)
    {
        $data = $this->calendarService->getMonthlyData($year, $month);

        return new CalendarResource($data);
    }

    /**
     * Get weekly calendar data.
     */
    public function weeklyData(string $date)
    {
        $data = $this->calendarService->getWeeklyData($date);

        return new CalendarResource($data);
    }
}
