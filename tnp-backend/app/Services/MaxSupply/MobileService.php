<?php

namespace App\Services\MaxSupply;

use App\Models\MaxSupply\ActivityLog;
use App\Models\MaxSupply\MaxSupply;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class MobileService
{
    /**
     * Get summary data for mobile dashboard.
     */
    public function getSummary(): array
    {
        $today = Carbon::today();
        $user = Auth::user();
        
        // Get counts
        $totalCount = MaxSupply::count();
        $pendingCount = MaxSupply::where('status', 'pending')->count();
        $inProgressCount = MaxSupply::where('status', 'in_progress')->count();
        $completedCount = MaxSupply::where('status', 'completed')->count();
        $overdueCount = MaxSupply::where('status', '!=', 'completed')
            ->where('status', '!=', 'cancelled')
            ->where('due_date', '<', $today->format('Y-m-d'))
            ->count();
        
        // Get today's jobs
        $todayJobs = MaxSupply::where(function ($query) use ($today) {
                $query->where('start_date', $today->format('Y-m-d'))
                    ->orWhere('expected_completion_date', $today->format('Y-m-d'))
                    ->orWhere('due_date', $today->format('Y-m-d'));
            })
            ->orderBy('priority', 'desc')
            ->orderBy('due_date', 'asc')
            ->limit(5)
            ->get();
        
        // Get user's jobs if user is available
        $userJobs = [];
        if ($user) {
            $userJobs = MaxSupply::where(function ($query) use ($user) {
                    $query->where('created_by', $user->id)
                        ->orWhere('updated_by', $user->id);
                })
                ->where('status', '!=', 'completed')
                ->where('status', '!=', 'cancelled')
                ->orderBy('due_date', 'asc')
                ->limit(5)
                ->get();
        }
        
        return [
            'counts' => [
                'total' => $totalCount,
                'pending' => $pendingCount,
                'in_progress' => $inProgressCount,
                'completed' => $completedCount,
                'overdue' => $overdueCount,
            ],
            'today_jobs' => $todayJobs->map(function ($job) {
                return [
                    'id' => $job->id,
                    'code' => $job->code,
                    'title' => $job->title,
                    'customer_name' => $job->customer_name,
                    'status' => $job->status,
                    'priority' => $job->priority,
                    'production_type' => $job->production_type,
                    'progress_percentage' => $job->progress_percentage,
                    'due_date' => $job->due_date->format('Y-m-d'),
                ];
            }),
            'user_jobs' => collect($userJobs)->map(function ($job) {
                return [
                    'id' => $job->id,
                    'code' => $job->code,
                    'title' => $job->title,
                    'customer_name' => $job->customer_name,
                    'status' => $job->status,
                    'priority' => $job->priority,
                    'production_type' => $job->production_type,
                    'progress_percentage' => $job->progress_percentage,
                    'due_date' => $job->due_date->format('Y-m-d'),
                ];
            }),
            'completion_rate' => $this->calculateCompletionRate(),
        ];
    }

    /**
     * Get recent activities for mobile view.
     */
    public function getRecentActivities(int $limit = 10): array
    {
        $activities = ActivityLog::with(['maxSupply', 'user'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
        
        return $activities->map(function ($activity) {
            return [
                'id' => $activity->id,
                'action' => $activity->action,
                'description' => $activity->description,
                'created_at' => $activity->created_at->format('Y-m-d H:i:s'),
                'time_ago' => $activity->created_at->diffForHumans(),
                'job' => $activity->maxSupply ? [
                    'id' => $activity->maxSupply->id,
                    'code' => $activity->maxSupply->code,
                    'title' => $activity->maxSupply->title,
                ] : null,
                'user' => $activity->user ? [
                    'id' => $activity->user->id,
                    'name' => $activity->user->name,
                ] : null,
            ];
        })->toArray();
    }

    /**
     * Get quick actions for mobile view.
     */
    public function getQuickActions(): array
    {
        $today = Carbon::today();
        
        return [
            [
                'type' => 'overdue',
                'title' => 'งานที่เกินกำหนด',
                'count' => MaxSupply::where('status', '!=', 'completed')
                    ->where('status', '!=', 'cancelled')
                    ->where('due_date', '<', $today->format('Y-m-d'))
                    ->count(),
                'icon' => 'warning',
                'color' => 'error',
                'route' => '/max-supplies?status=overdue',
            ],
            [
                'type' => 'today',
                'title' => 'งานวันนี้',
                'count' => MaxSupply::where(function ($query) use ($today) {
                        $query->where('start_date', $today->format('Y-m-d'))
                            ->orWhere('expected_completion_date', $today->format('Y-m-d'))
                            ->orWhere('due_date', $today->format('Y-m-d'));
                    })
                    ->count(),
                'icon' => 'today',
                'color' => 'info',
                'route' => '/calendar/day/' . $today->format('Y-m-d'),
            ],
            [
                'type' => 'urgent',
                'title' => 'งานด่วน',
                'count' => MaxSupply::where('priority', 'urgent')
                    ->where('status', '!=', 'completed')
                    ->where('status', '!=', 'cancelled')
                    ->count(),
                'icon' => 'priority_high',
                'color' => 'warning',
                'route' => '/max-supplies?priority=urgent',
            ],
            [
                'type' => 'create',
                'title' => 'สร้างงานใหม่',
                'icon' => 'add_circle',
                'color' => 'success',
                'route' => '/max-supplies/create',
            ],
        ];
    }

    /**
     * Calculate the completion rate for the current month.
     */
    private function calculateCompletionRate(): array
    {
        $today = Carbon::today();
        $startOfMonth = $today->copy()->startOfMonth();
        $endOfMonth = $today->copy()->endOfMonth();
        
        $dueThisMonth = MaxSupply::whereBetween('due_date', [
                $startOfMonth->format('Y-m-d'),
                $endOfMonth->format('Y-m-d')
            ])
            ->count();
        
        $completedOnTime = MaxSupply::where('status', 'completed')
            ->whereBetween('due_date', [
                $startOfMonth->format('Y-m-d'),
                $endOfMonth->format('Y-m-d')
            ])
            ->whereColumn('actual_completion_date', '<=', 'due_date')
            ->count();
        
        $completedLate = MaxSupply::where('status', 'completed')
            ->whereBetween('due_date', [
                $startOfMonth->format('Y-m-d'),
                $endOfMonth->format('Y-m-d')
            ])
            ->whereColumn('actual_completion_date', '>', 'due_date')
            ->count();
        
        $rate = $dueThisMonth > 0 ? round(($completedOnTime / $dueThisMonth) * 100, 2) : 0;
        
        return [
            'percentage' => $rate,
            'on_time' => $completedOnTime,
            'late' => $completedLate,
            'due_this_month' => $dueThisMonth,
        ];
    }
}
