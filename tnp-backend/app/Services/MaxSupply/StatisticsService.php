<?php

namespace App\Services\MaxSupply;

use App\Models\MaxSupply\MaxSupply;
use Carbon\Carbon;

class StatisticsService
{
    /**
     * Get dashboard statistics.
     */
    public function getDashboardStats(): array
    {
        $today = Carbon::today();
        $startOfWeek = Carbon::today()->startOfWeek();
        $endOfWeek = Carbon::today()->endOfWeek();
        $startOfMonth = Carbon::today()->startOfMonth();
        $endOfMonth = Carbon::today()->endOfMonth();

        $upcomingDeadlines = MaxSupply::where('status', '!=', 'completed')
            ->where('status', '!=', 'cancelled')
            ->where('due_date', '>=', $today)
            ->where('due_date', '<=', $today->copy()->addDays(7))
            ->orderBy('due_date')
            ->get();

        return [
            'counts' => [
                'total' => MaxSupply::count(),
                'pending' => MaxSupply::where('status', 'pending')->count(),
                'in_progress' => MaxSupply::where('status', 'in_progress')->count(),
                'completed' => MaxSupply::where('status', 'completed')->count(),
                'cancelled' => MaxSupply::where('status', 'cancelled')->count(),
                'overdue' => MaxSupply::where('status', '!=', 'completed')
                    ->where('status', '!=', 'cancelled')
                    ->where('due_date', '<', $today)
                    ->count(),
            ],
            'time_periods' => [
                'today' => $this->getPeriodStats($today, $today),
                'this_week' => $this->getPeriodStats($startOfWeek, $endOfWeek),
                'this_month' => $this->getPeriodStats($startOfMonth, $endOfMonth),
            ],
            'production_types' => [
                'screen' => MaxSupply::where('production_type', 'screen')->count(),
                'dtf' => MaxSupply::where('production_type', 'dtf')->count(),
                'sublimation' => MaxSupply::where('production_type', 'sublimation')->count(),
            ],
            'upcoming_deadlines' => $upcomingDeadlines->map(function ($supply) {
                return [
                    'id' => $supply->id,
                    'code' => $supply->code,
                    'title' => $supply->title,
                    'customer_name' => $supply->customer_name,
                    'due_date' => $supply->due_date->format('Y-m-d'),
                    'days_remaining' => $supply->due_date->diffInDays(Carbon::today()),
                    'status' => $supply->status,
                    'progress_percentage' => $supply->progress_percentage,
                    'production_type' => $supply->production_type,
                ];
            }),
            'trends' => $this->calculateTrends(),
        ];
    }

    /**
     * Get production type statistics.
     */
    public function getProductionTypeStats(): array
    {
        $productionTypes = ['screen', 'dtf', 'sublimation'];
        $result = [];
        
        foreach ($productionTypes as $type) {
            $supplies = MaxSupply::where('production_type', $type)->get();
            
            $result[$type] = [
                'count' => $supplies->count(),
                'completed' => $supplies->where('status', 'completed')->count(),
                'in_progress' => $supplies->where('status', 'in_progress')->count(),
                'pending' => $supplies->where('status', 'pending')->count(),
                'cancelled' => $supplies->where('status', 'cancelled')->count(),
                'avg_completion_days' => $this->calculateAvgCompletionDays($supplies->where('status', 'completed')),
                'total_points' => $this->calculateTotalPoints($type),
                'monthly_trend' => $this->calculateMonthlyTrend($type),
            ];
        }

        return $result;
    }

    /**
     * Get monthly statistics.
     */
    public function getMonthlyStats(int $year, int $month): array
    {
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();
        
        $supplies = MaxSupply::whereBetween('created_at', [$startDate, $endDate])
            ->orWhereBetween('expected_completion_date', [$startDate, $endDate])
            ->orWhereBetween('actual_completion_date', [$startDate, $endDate])
            ->get();
        
        $dailyStats = [];
        for ($day = 1; $day <= $endDate->day; $day++) {
            $currentDate = Carbon::createFromDate($year, $month, $day);
            $dateKey = $currentDate->format('Y-m-d');
            
            $dailyStats[$dateKey] = [
                'date' => $dateKey,
                'day' => $day,
                'created' => $supplies->where('created_at', '>=', $currentDate->copy()->startOfDay())
                    ->where('created_at', '<=', $currentDate->copy()->endOfDay())
                    ->count(),
                'completed' => $supplies->where('actual_completion_date', '>=', $currentDate->copy()->startOfDay())
                    ->where('actual_completion_date', '<=', $currentDate->copy()->endOfDay())
                    ->count(),
                'due' => $supplies->where('due_date', $currentDate->format('Y-m-d'))->count(),
            ];
        }

        return [
            'year' => $year,
            'month' => $month,
            'totals' => [
                'created' => $supplies->where('created_at', '>=', $startDate)
                    ->where('created_at', '<=', $endDate)
                    ->count(),
                'completed' => $supplies->where('actual_completion_date', '>=', $startDate)
                    ->where('actual_completion_date', '<=', $endDate)
                    ->count(),
                'due' => $supplies->where('due_date', '>=', $startDate->format('Y-m-d'))
                    ->where('due_date', '<=', $endDate->format('Y-m-d'))
                    ->count(),
            ],
            'by_type' => [
                'screen' => $supplies->where('production_type', 'screen')->count(),
                'dtf' => $supplies->where('production_type', 'dtf')->count(),
                'sublimation' => $supplies->where('production_type', 'sublimation')->count(),
            ],
            'by_status' => [
                'pending' => $supplies->where('status', 'pending')->count(),
                'in_progress' => $supplies->where('status', 'in_progress')->count(),
                'completed' => $supplies->where('status', 'completed')->count(),
                'cancelled' => $supplies->where('status', 'cancelled')->count(),
            ],
            'daily_stats' => $dailyStats,
            'weekly_stats' => $this->calculateWeeklyStats($supplies, $startDate, $endDate),
        ];
    }

    /**
     * Get stats for a time period.
     */
    private function getPeriodStats(Carbon $startDate, Carbon $endDate): array
    {
        $created = MaxSupply::whereBetween('created_at', [$startDate, $endDate])->count();
        $completed = MaxSupply::whereBetween('actual_completion_date', [$startDate, $endDate])->count();
        $due = MaxSupply::whereBetween('due_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])->count();
        
        return [
            'created' => $created,
            'completed' => $completed,
            'due' => $due,
        ];
    }

    /**
     * Calculate weekly statistics.
     */
    private function calculateWeeklyStats($supplies, Carbon $startDate, Carbon $endDate): array
    {
        $weeks = [];
        $current = $startDate->copy();
        
        while ($current <= $endDate) {
            $weekStart = $current->copy()->startOfWeek();
            $weekEnd = $current->copy()->endOfWeek();
            
            $weeklySupplies = $supplies->filter(function($supply) use ($weekStart, $weekEnd) {
                return ($supply->created_at >= $weekStart && $supply->created_at <= $weekEnd) ||
                       ($supply->actual_completion_date && $supply->actual_completion_date >= $weekStart && $supply->actual_completion_date <= $weekEnd) ||
                       ($supply->due_date >= $weekStart->format('Y-m-d') && $supply->due_date <= $weekEnd->format('Y-m-d'));
            });
            
            $weeks[] = [
                'week' => $current->weekOfMonth,
                'start_date' => $weekStart->format('Y-m-d'),
                'end_date' => $weekEnd->format('Y-m-d'),
                'created' => $weeklySupplies->filter(function($supply) use ($weekStart, $weekEnd) {
                    return $supply->created_at >= $weekStart && $supply->created_at <= $weekEnd;
                })->count(),
                'completed' => $weeklySupplies->filter(function($supply) use ($weekStart, $weekEnd) {
                    return $supply->actual_completion_date && $supply->actual_completion_date >= $weekStart && $supply->actual_completion_date <= $weekEnd;
                })->count(),
                'due' => $weeklySupplies->filter(function($supply) use ($weekStart, $weekEnd) {
                    return $supply->due_date >= $weekStart->format('Y-m-d') && $supply->due_date <= $weekEnd->format('Y-m-d');
                })->count(),
            ];
            
            $current->addWeek();
        }
        
        return $weeks;
    }

    /**
     * Calculate average completion days for supplies.
     */
    private function calculateAvgCompletionDays($supplies): float
    {
        if ($supplies->isEmpty()) {
            return 0;
        }
        
        $totalDays = 0;
        $count = 0;
        
        foreach ($supplies as $supply) {
            if ($supply->actual_completion_date && $supply->start_date) {
                $totalDays += $supply->start_date->diffInDays($supply->actual_completion_date);
                $count++;
            }
        }
        
        return $count > 0 ? round($totalDays / $count, 2) : 0;
    }

    /**
     * Calculate total points for a production type.
     */
    private function calculateTotalPoints(string $type): int
    {
        $columnName = $type . '_points';
        return (int) MaxSupply::sum($columnName);
    }

    /**
     * Calculate trends for dashboard.
     */
    private function calculateTrends(): array
    {
        $today = Carbon::today();
        
        // Last 6 months
        $months = [];
        for ($i = 0; $i < 6; $i++) {
            $date = $today->copy()->subMonths($i);
            $monthStart = $date->copy()->startOfMonth();
            $monthEnd = $date->copy()->endOfMonth();
            
            $months[$date->format('Y-m')] = [
                'label' => $date->format('M Y'),
                'created' => MaxSupply::whereBetween('created_at', [$monthStart, $monthEnd])->count(),
                'completed' => MaxSupply::whereBetween('actual_completion_date', [$monthStart, $monthEnd])->count(),
            ];
        }
        
        return array_reverse($months);
    }

    /**
     * Calculate monthly trend for a production type.
     */
    private function calculateMonthlyTrend(string $type): array
    {
        $today = Carbon::today();
        
        // Last 6 months
        $months = [];
        for ($i = 0; $i < 6; $i++) {
            $date = $today->copy()->subMonths($i);
            $monthStart = $date->copy()->startOfMonth();
            $monthEnd = $date->copy()->endOfMonth();
            
            $months[$date->format('Y-m')] = [
                'label' => $date->format('M Y'),
                'count' => MaxSupply::where('production_type', $type)
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count(),
            ];
        }
        
        return array_reverse($months);
    }
}
