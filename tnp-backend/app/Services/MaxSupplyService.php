<?php

namespace App\Services;

use App\Models\MaxSupply;
use App\Models\MaxSupplyLog;
use Illuminate\Support\Facades\DB;

class MaxSupplyService
{
    /**
     * Create a new max supply record
     */
    public function create(array $data): MaxSupply
    {
        return DB::transaction(function () use ($data) {
            $maxSupply = MaxSupply::create($data);

            // Log creation
            MaxSupplyLog::create([
                'max_supply_id' => $maxSupply->id,
                'action' => 'created',
                'new_data' => $maxSupply->toArray(),
                'description' => 'Max supply record created',
                'user_id' => auth()->id() ?? $data['created_by'],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return $maxSupply->load(['creator', 'updater', 'files']);
        });
    }

    /**
     * Update an existing max supply record
     */
    public function update(MaxSupply $maxSupply, array $data): MaxSupply
    {
        return DB::transaction(function () use ($maxSupply, $data) {
            $oldData = $maxSupply->toArray();
            
            $maxSupply->update($data);
            
            // Log update (the model's boot method will handle this)
            
            return $maxSupply->load(['creator', 'updater', 'files']);
        });
    }

    /**
     * Delete a max supply record
     */
    public function delete(MaxSupply $maxSupply): bool
    {
        return DB::transaction(function () use ($maxSupply) {
            // Log deletion
            MaxSupplyLog::create([
                'max_supply_id' => $maxSupply->id,
                'action' => 'deleted',
                'old_data' => $maxSupply->toArray(),
                'description' => 'Max supply record deleted',
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            // Delete associated files (cascade will handle this)
            // Delete the record
            return $maxSupply->delete();
        });
    }

    /**
     * Get calendar data for max supplies
     */
    public function getCalendarData(array $filters = []): array
    {
        $query = MaxSupply::with(['creator', 'files']);

        // Apply date range filter
        if (isset($filters['start']) && isset($filters['end'])) {
            $query->where(function ($q) use ($filters) {
                $q->whereBetween('start_date', [$filters['start'], $filters['end']])
                  ->orWhereBetween('end_date', [$filters['start'], $filters['end']])
                  ->orWhere(function ($subQ) use ($filters) {
                      $subQ->where('start_date', '<=', $filters['start'])
                           ->where('end_date', '>=', $filters['end']);
                  });
            });
        }

        // Apply status filter
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Apply search filter
        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('production_code', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('product_name', 'like', "%{$search}%");
            });
        }

        $maxSupplies = $query->get();

        return $maxSupplies->map(function ($maxSupply) {
            return [
                'id' => $maxSupply->id,
                'title' => $maxSupply->production_code . ' - ' . $maxSupply->customer_name,
                'start' => $maxSupply->start_date->format('Y-m-d'),
                'end' => $maxSupply->end_date->addDay()->format('Y-m-d'), // Add 1 day for FullCalendar
                'backgroundColor' => $this->getStatusColor($maxSupply->status),
                'borderColor' => $this->getPriorityColor($maxSupply->priority),
                'textColor' => '#ffffff',
                'extendedProps' => [
                    'status' => $maxSupply->status,
                    'priority' => $maxSupply->priority,
                    'customer_name' => $maxSupply->customer_name,
                    'product_name' => $maxSupply->product_name,
                    'quantity' => $maxSupply->quantity,
                    'print_points' => $maxSupply->print_points,
                    'notes' => $maxSupply->notes,
                    'duration' => $maxSupply->duration,
                    'creator' => $maxSupply->creator?->name,
                    'files_count' => $maxSupply->files->count(),
                ],
            ];
        })->toArray();
    }

    /**
     * Get dashboard statistics
     */
    public function getDashboardStats(): array
    {
        $today = now();
        $thisWeek = now()->startOfWeek();
        $thisMonth = now()->startOfMonth();

        return [
            'total_supplies' => MaxSupply::count(),
            'pending_supplies' => MaxSupply::where('status', 'pending')->count(),
            'in_progress_supplies' => MaxSupply::where('status', 'in_progress')->count(),
            'completed_supplies' => MaxSupply::where('status', 'completed')->count(),
            'cancelled_supplies' => MaxSupply::where('status', 'cancelled')->count(),
            
            'this_week_created' => MaxSupply::where('created_at', '>=', $thisWeek)->count(),
            'this_month_created' => MaxSupply::where('created_at', '>=', $thisMonth)->count(),
            
            'urgent_supplies' => MaxSupply::where('priority', 'urgent')
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->count(),
                
            'overdue_supplies' => MaxSupply::where('end_date', '<', $today)
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->count(),
                
            'today_deadline' => MaxSupply::whereDate('end_date', $today)
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->count(),
        ];
    }

    /**
     * Get status color for calendar
     */
    private function getStatusColor(string $status): string
    {
        return match($status) {
            'pending' => '#fbbf24',      // yellow
            'in_progress' => '#3b82f6',  // blue
            'completed' => '#10b981',    // green
            'cancelled' => '#ef4444',    // red
            default => '#6b7280'         // gray
        };
    }

    /**
     * Get priority color for calendar
     */
    private function getPriorityColor(string $priority): string
    {
        return match($priority) {
            'low' => '#10b981',      // green
            'medium' => '#fbbf24',   // yellow
            'high' => '#f97316',     // orange
            'urgent' => '#ef4444',   // red
            default => '#6b7280'     // gray
        };
    }
}
