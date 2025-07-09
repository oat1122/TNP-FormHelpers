<?php

namespace App\Services\MaxSupply;

use App\Models\MaxSupply\MaxSupply;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CalendarService
{
    /**
     * Get calendar data based on view type and date.
     */
    public function getCalendarData(string $view, string $date): array
    {
        $date = Carbon::parse($date);
        
        return match($view) {
            'month' => $this->getMonthlyData($date->year, $date->month),
            'week' => $this->getWeeklyData($date->format('Y-m-d')),
            'day' => $this->getDailyData($date->format('Y-m-d')),
            default => $this->getMonthlyData($date->year, $date->month)
        };
    }

    /**
     * Get monthly calendar data.
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

        // Group jobs by day
        $events = [];
        $statistics = [
            'weekly_stats' => [],
            'monthly_total' => [
                'screen' => 0,
                'dtf' => 0,
                'sublimation' => 0,
                'total_jobs' => 0,
                'hours' => 0
            ]
        ];

        foreach ($maxSupplies as $maxSupply) {
            $events[] = [
                'id' => $maxSupply->id,
                'code' => $maxSupply->code,
                'title' => $maxSupply->title,
                'production_type' => $maxSupply->production_type,
                'status' => $maxSupply->status,
                'start_date' => $maxSupply->start_date->format('Y-m-d'),
                'end_date' => $maxSupply->expected_completion_date->format('Y-m-d'),
                'creator' => $maxSupply->creator ? $maxSupply->creator->name : null,
                'customer' => $maxSupply->customer_name,
                'quantity' => $maxSupply->total_quantity,
                'progress' => $maxSupply->progress_percentage,
                'is_overdue' => $maxSupply->is_overdue,
            ];

            // Calculate statistics
            $statistics['monthly_total'][$maxSupply->production_type]++;
            $statistics['monthly_total']['total_jobs']++;
            $statistics['monthly_total']['hours'] += $maxSupply->duration_days * 8; // Assume 8 hours/day
        }

        // Calculate weekly statistics
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
     * Get weekly calendar data.
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
                'day_name' => $currentDate->format('l'),
                'events' => $this->formatEvents($dayEvents),
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
     * Get daily calendar data.
     */
    public function getDailyData(string $date): array
    {
        $targetDate = Carbon::parse($date);

        $maxSupplies = MaxSupply::with(['worksheet', 'creator'])
            ->where(function ($query) use ($targetDate) {
                $query->where('start_date', '<=', $targetDate)
                      ->where('expected_completion_date', '>=', $targetDate);
            })
            ->orderBy('start_date')
            ->get();

        $events = $this->formatEvents($maxSupplies);
        $timeSlots = [
            '09:00-12:00' => [],
            '13:00-16:00' => [],
            '17:00-20:00' => []
        ];

        // Distribute events to time slots
        $slottedEvents = $this->distributeEventsToTimeSlots($maxSupplies, array_keys($timeSlots));

        return [
            'date' => $targetDate->format('Y-m-d'),
            'events' => $events,
            'time_slots' => $slottedEvents,
            'statistics' => $this->calculatePeriodStats($maxSupplies)
        ];
    }

    /**
     * Format events for response.
     */
    private function formatEvents(Collection $maxSupplies): array
    {
        return $maxSupplies->map(function ($maxSupply) {
            return [
                'id' => $maxSupply->id,
                'code' => $maxSupply->code,
                'title' => $maxSupply->title,
                'production_type' => $maxSupply->production_type,
                'status' => $maxSupply->status,
                'customer' => $maxSupply->customer_name,
                'progress' => $maxSupply->progress_percentage,
                'creator' => $maxSupply->creator ? $maxSupply->creator->name : null,
                'priority' => $maxSupply->priority,
                'quantity' => $maxSupply->total_quantity,
                'is_overdue' => $maxSupply->is_overdue,
            ];
        })->toArray();
    }

    /**
     * Calculate weekly statistics.
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
                       $item->expected_completion_date->between($weekStart, $weekEnd) ||
                       ($item->start_date <= $weekStart && $item->expected_completion_date >= $weekEnd);
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
     * Calculate period statistics.
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
            ],
        ];
    }

    /**
     * Generate a calendar grid for the month.
     */
    private function generateCalendarGrid(int $year, int $month, array $events): array
    {
        $startDate = Carbon::createFromDate($year, $month, 1);
        $endDate = $startDate->copy()->endOfMonth();
        $grid = [];

        // Group events by date
        $eventsByDate = [];
        foreach ($events as $event) {
            $start = Carbon::parse($event['start_date']);
            $end = Carbon::parse($event['end_date']);
            
            for ($date = $start->copy(); $date <= $end; $date->addDay()) {
                $dateKey = $date->format('Y-m-d');
                if (!isset($eventsByDate[$dateKey])) {
                    $eventsByDate[$dateKey] = [];
                }
                $eventsByDate[$dateKey][] = $event;
            }
        }

        // Create grid for each day in the month
        for ($day = 1; $day <= $endDate->day; $day++) {
            $currentDate = Carbon::createFromDate($year, $month, $day);
            $dateKey = $currentDate->format('Y-m-d');
            
            $grid[$day] = [
                'date' => $dateKey,
                'day' => $day,
                'events' => $eventsByDate[$dateKey] ?? [],
                'is_weekend' => $currentDate->isWeekend(),
                'is_today' => $currentDate->isToday(),
                'count' => count($eventsByDate[$dateKey] ?? []),
            ];
        }

        return $grid;
    }

    /**
     * Distribute events to time slots.
     */
    private function distributeEventsToTimeSlots(Collection $events, array $timeSlots): array
    {
        $slots = [];
        foreach ($timeSlots as $slot) {
            $slots[$slot] = [];
        }

        $events->each(function ($event, $index) use (&$slots, $timeSlots) {
            $slotIndex = $index % count($timeSlots);
            $slot = $timeSlots[$slotIndex];
            
            $slots[$slot][] = [
                'id' => $event->id,
                'code' => $event->code,
                'title' => $event->title,
                'production_type' => $event->production_type,
                'status' => $event->status,
                'priority' => $event->priority,
                'customer' => $event->customer_name,
                'progress' => $event->progress_percentage,
            ];
        });

        return $slots;
    }
}
