<?php

namespace App\Services;

use App\Models\MaxSupply;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CalendarService
{
    /**
     * ข้อมูลปฏิทิน
     */
    public function getCalendarData(string $view, string $date): array
    {
        // ตรวจสอบและแปลงข้อมูล
        if (empty($date)) {
            $date = now()->format('Y-m-d');
        }
        
        if (empty($view)) {
            $view = 'month';
        }

        try {
            $startDate = Carbon::parse($date);
        } catch (\Exception $e) {
            $startDate = Carbon::now();
        }

        return match($view) {
            'month' => $this->getMonthlyData($startDate->year, $startDate->month),
            'week' => $this->getWeeklyData($date),
            'day' => $this->getDailyData($date),
            default => $this->getMonthlyData($startDate->year, $startDate->month)
        };
    }

    /**
     * ข้อมูลรายเดือน
     */
    public function getMonthlyData(int $year, int $month): array
    {
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $maxSupplies = MaxSupply::with(['worksheet', 'creator'])
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('start_date', [$startDate, $endDate])
                      ->orWhereBetween('expected_completion_date', [$startDate, $endDate])
                      ->orWhere(function ($q) use ($startDate, $endDate) {
                          $q->where('start_date', '<=', $startDate)
                            ->where('expected_completion_date', '>=', $endDate);
                      });
            })
            ->orderBy('start_date')
            ->get();

        // จัดกลุ่มงานตามวัน
        $events = [];
        $statistics = [
            'weekly_stats' => [],
            'monthly_total' => [
                'screen' => 0,
                'dtf' => 0,
                'sublimation' => 0,
                'total_jobs' => 0,
                'completed' => 0,
                'in_progress' => 0,
                'pending' => 0,
            ]
        ];

        foreach ($maxSupplies as $maxSupply) {
            $events[] = [
                'id' => $maxSupply->id,
                'code' => $maxSupply->code,
                'title' => $maxSupply->title,
                'production_type' => $maxSupply->production_type,
                'status' => $maxSupply->status,
                'priority' => $maxSupply->priority,
                'start_date' => $maxSupply->start_date->format('Y-m-d'),
                'end_date' => $maxSupply->expected_completion_date->format('Y-m-d'),
                'due_date' => $maxSupply->due_date->format('Y-m-d'),
                'creator' => $maxSupply->creator->user_nickname ?? $maxSupply->creator->username,
                'customer' => $maxSupply->customer_name,
                'quantity' => $maxSupply->total_quantity,
                'progress' => $maxSupply->progress_percentage,
                'is_overdue' => $maxSupply->is_overdue,
                'color' => $this->getProductionTypeColor($maxSupply->production_type),
            ];

            // คำนวณสถิติ
            $statistics['monthly_total'][$maxSupply->production_type]++;
            $statistics['monthly_total']['total_jobs']++;
            $statistics['monthly_total'][$maxSupply->status]++;
        }

        // คำนวณสถิติรายสัปดาห์
        $statistics['weekly_stats'] = $this->calculateWeeklyStats($maxSupplies, $startDate, $endDate);

        return [
            'year' => $year,
            'month' => $month,
            'events' => $events,
            'statistics' => $statistics,
            'calendar_grid' => $this->generateCalendarGrid($year, $month, $events)
        ];
    }

    /**
     * ข้อมูลรายสัปดาห์
     */
    public function getWeeklyData(string $date): array
    {
        $startDate = Carbon::parse($date)->startOfWeek();
        $endDate = $startDate->copy()->endOfWeek();

        $maxSupplies = MaxSupply::with(['worksheet', 'creator'])
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('start_date', [$startDate, $endDate])
                      ->orWhereBetween('expected_completion_date', [$startDate, $endDate])
                      ->orWhere(function ($q) use ($startDate, $endDate) {
                          $q->where('start_date', '<=', $startDate)
                            ->where('expected_completion_date', '>=', $endDate);
                      });
            })
            ->orderBy('start_date')
            ->get();

        $timeline = [];
        $timeSlots = ['09:00-12:00', '13:00-16:00', '17:00-20:00'];

        for ($i = 0; $i < 7; $i++) {
            $currentDate = $startDate->copy()->addDays($i);
            $dayEvents = $maxSupplies->filter(function ($item) use ($currentDate) {
                return $currentDate->between($item->start_date, $item->expected_completion_date);
            });

            $timeline[$currentDate->format('Y-m-d')] = [
                'date' => $currentDate->format('Y-m-d'),
                'day_name' => $currentDate->locale('th')->dayName,
                'events' => $this->formatEventsForTimeline($dayEvents),
                'time_slots' => $this->distributeEventsToTimeSlots($dayEvents, $timeSlots)
            ];
        }

        return [
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'timeline' => $timeline,
            'statistics' => $this->calculatePeriodStats($maxSupplies)
        ];
    }

    /**
     * ข้อมูลรายวัน
     */
    public function getDailyData(string $date): array
    {
        $targetDate = Carbon::parse($date);

        $maxSupplies = MaxSupply::with(['worksheet', 'creator'])
            ->where(function ($query) use ($targetDate) {
                $query->where('start_date', '<=', $targetDate)
                      ->where('expected_completion_date', '>=', $targetDate);
            })
            ->orderBy('priority', 'desc')
            ->orderBy('start_date')
            ->get();

        $events = [];
        $timeSlots = [
            '09:00-12:00' => [],
            '13:00-16:00' => [],
            '17:00-20:00' => []
        ];

        foreach ($maxSupplies as $maxSupply) {
            $event = [
                'id' => $maxSupply->id,
                'code' => $maxSupply->code,
                'title' => $maxSupply->title,
                'production_type' => $maxSupply->production_type,
                'status' => $maxSupply->status,
                'priority' => $maxSupply->priority,
                'customer' => $maxSupply->customer_name,
                'progress' => $maxSupply->progress_percentage,
                'creator' => $maxSupply->creator->user_nickname ?? $maxSupply->creator->username,
                'quantity' => $maxSupply->total_quantity,
                'color' => $this->getProductionTypeColor($maxSupply->production_type),
            ];

            $events[] = $event;

            // แจกจ่ายงานไปยัง time slots
            $slotIndex = $maxSupply->id % 3;
            $slot = array_keys($timeSlots)[$slotIndex];
            $timeSlots[$slot][] = $event;
        }

        return [
            'date' => $targetDate->format('Y-m-d'),
            'day_name' => $targetDate->locale('th')->dayName,
            'events' => $events,
            'time_slots' => $timeSlots,
            'statistics' => $this->calculatePeriodStats($maxSupplies)
        ];
    }

    /**
     * คำนวณสถิติรายสัปดาห์
     */
    private function calculateWeeklyStats(Collection $maxSupplies, Carbon $startDate, Carbon $endDate): array
    {
        $weeks = [];
        $current = $startDate->copy();

        while ($current <= $endDate) {
            $weekStart = $current->copy()->startOfWeek();
            $weekEnd = $current->copy()->endOfWeek();

            $weekEvents = $maxSupplies->filter(function ($item) use ($weekStart, $weekEnd) {
                return $item->start_date->between($weekStart, $weekEnd) ||
                       $item->expected_completion_date->between($weekStart, $weekEnd);
            });

            $weeks[] = [
                'week' => $current->weekOfMonth,
                'screen' => $weekEvents->where('production_type', 'screen')->count(),
                'dtf' => $weekEvents->where('production_type', 'dtf')->count(),
                'sublimation' => $weekEvents->where('production_type', 'sublimation')->count(),
                'total' => $weekEvents->count(),
            ];

            $current->addWeek();
        }

        return $weeks;
    }

    /**
     * คำนวณสถิติรายช่วงเวลา
     */
    private function calculatePeriodStats(Collection $maxSupplies): array
    {
        return [
            'total_jobs' => $maxSupplies->count(),
            'by_type' => [
                'screen' => $maxSupplies->where('production_type', 'screen')->count(),
                'dtf' => $maxSupplies->where('production_type', 'dtf')->count(),
                'sublimation' => $maxSupplies->where('production_type', 'sublimation')->count(),
            ],
            'by_status' => [
                'pending' => $maxSupplies->where('status', 'pending')->count(),
                'in_progress' => $maxSupplies->where('status', 'in_progress')->count(),
                'completed' => $maxSupplies->where('status', 'completed')->count(),
                'cancelled' => $maxSupplies->where('status', 'cancelled')->count(),
            ],
            'by_priority' => [
                'low' => $maxSupplies->where('priority', 'low')->count(),
                'normal' => $maxSupplies->where('priority', 'normal')->count(),
                'high' => $maxSupplies->where('priority', 'high')->count(),
                'urgent' => $maxSupplies->where('priority', 'urgent')->count(),
            ]
        ];
    }

    /**
     * สร้าง calendar grid
     */
    private function generateCalendarGrid(int $year, int $month, array $events): array
    {
        $startDate = Carbon::createFromDate($year, $month, 1);
        $endDate = $startDate->copy()->endOfMonth();
        $grid = [];

        // จัดกลุ่ม events ตามวัน
        $eventsByDate = [];
        foreach ($events as $event) {
            $start = Carbon::parse($event['start_date']);
            $end = Carbon::parse($event['end_date']);

            for ($date = $start; $date <= $end; $date->addDay()) {
                $dateKey = $date->format('Y-m-d');
                if (!isset($eventsByDate[$dateKey])) {
                    $eventsByDate[$dateKey] = [];
                }
                $eventsByDate[$dateKey][] = $event;
            }
        }

        // สร้าง grid
        for ($day = 1; $day <= $endDate->day; $day++) {
            $currentDate = Carbon::createFromDate($year, $month, $day);
            $dateKey = $currentDate->format('Y-m-d');

            $grid[$day] = [
                'date' => $dateKey,
                'day' => $day,
                'events' => $eventsByDate[$dateKey] ?? [],
                'event_count' => count($eventsByDate[$dateKey] ?? []),
                'is_weekend' => $currentDate->isWeekend(),
                'is_today' => $currentDate->isToday(),
            ];
        }

        return $grid;
    }

    /**
     * แจกจ่ายงานไปยัง time slots
     */
    private function distributeEventsToTimeSlots(Collection $events, array $timeSlots): array
    {
        $slots = [];
        foreach ($timeSlots as $slot) {
            $slots[$slot] = [];
        }

        foreach ($events as $index => $event) {
            $slotIndex = $index % count($timeSlots);
            $slot = $timeSlots[$slotIndex];
            $slots[$slot][] = $this->formatEventForTimeSlot($event);
        }

        return $slots;
    }

    /**
     * จัดรูปแบบ event สำหรับ timeline
     */
    private function formatEventsForTimeline(Collection $events): array
    {
        return $events->map(function ($event) {
            return [
                'id' => $event->id,
                'code' => $event->code,
                'title' => $event->title,
                'production_type' => $event->production_type,
                'status' => $event->status,
                'priority' => $event->priority,
                'progress' => $event->progress_percentage,
                'color' => $this->getProductionTypeColor($event->production_type),
            ];
        })->values()->toArray();
    }

    /**
     * จัดรูปแบบ event สำหรับ time slot
     */
    private function formatEventForTimeSlot($event): array
    {
        return [
            'id' => $event->id,
            'code' => $event->code,
            'title' => $event->title,
            'production_type' => $event->production_type,
            'customer' => $event->customer_name,
            'progress' => $event->progress_percentage,
            'color' => $this->getProductionTypeColor($event->production_type),
        ];
    }

    /**
     * กำหนดสีตามประเภทการผลิต
     */
    private function getProductionTypeColor(string $type): string
    {
        return match($type) {
            'screen' => '#7c3aed',      // Violet-600
            'dtf' => '#0891b2',         // Cyan-600
            'sublimation' => '#16a34a', // Green-600
            default => '#6b7280'        // Gray-500
        };
    }
}
