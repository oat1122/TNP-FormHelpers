<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Carbon\Carbon;
use App\Models\Worksheet\Worksheet;
use App\Models\User\User;

class MaxSupply extends Model
{
    use HasUuids;

    protected $fillable = [
        'code',
        'worksheet_id',
        'title',
        'customer_name',
        'production_type',
        'start_date',
        'expected_completion_date',
        'due_date',
        'actual_completion_date',
        'status',
        'priority',
        'shirt_type',
        'total_quantity',
        'completed_quantity',
        'sizes',
        'screen_points',
        'dtf_points',
        'sublimation_points',
        'embroidery_points',
        'notes',
        'special_instructions',
        'work_calculations',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'sizes' => 'array',
        'work_calculations' => 'array',
        'start_date' => 'date',
        'expected_completion_date' => 'date',
        'due_date' => 'date',
        'actual_completion_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function worksheet(): BelongsTo
    {
        return $this->belongsTo(Worksheet::class, 'worksheet_id', 'worksheet_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by', 'user_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    // Scopes
    public function scopeByProductionType($query, $type)
    {
        return $query->where('production_type', $type);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByDateRange($query, $start, $end)
    {
        // กรองตาม start_date (วันที่เริ่มงาน)
        return $query->whereBetween('start_date', [
            Carbon::parse($start)->startOfDay(),
            Carbon::parse($end)->endOfDay()
        ]);
    }

    public function scopeByCompletionDateRange($query, $start, $end)
    {
        // กรองตาม expected_completion_date (วันที่คาดว่าจะเสร็จ)
        return $query->whereBetween('expected_completion_date', [
            Carbon::parse($start)->startOfDay(),
            Carbon::parse($end)->endOfDay()
        ]);
    }

    public function scopeByCreatedDateRange($query, $start, $end)
    {
        // กรองตาม created_at (วันที่สร้าง)
        return $query->whereBetween('created_at', [
            Carbon::parse($start)->startOfDay(),
            Carbon::parse($end)->endOfDay()
        ]);
    }

    public function scopeByDueDateRange($query, $start, $end)
    {
        // กรองตาม due_date (วันที่ครบกำหนด)
        return $query->whereBetween('due_date', [
            Carbon::parse($start)->startOfDay(),
            Carbon::parse($end)->endOfDay()
        ]);
    }

    public function scopeByActualCompletionDateRange($query, $start, $end)
    {
        // กรองตาม actual_completion_date (วันที่เสร็จจริง)
        return $query->whereBetween('actual_completion_date', [
            Carbon::parse($start)->startOfDay(),
            Carbon::parse($end)->endOfDay()
        ]);
    }

    public function scopeByDueDateOrCompletionDate($query, $start, $end)
    {
        // กรองตาม due_date หรือ actual_completion_date
        $startDate = Carbon::parse($start)->startOfDay();
        $endDate = Carbon::parse($end)->endOfDay();
        
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('due_date', [$startDate, $endDate])
              ->orWhereBetween('actual_completion_date', [$startDate, $endDate]);
        });
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
                     ->whereNotIn('status', ['completed', 'cancelled']);
    }

    public function scopeUrgent($query)
    {
        // งานที่ใกล้ครบกำหนดภายใน 2 วัน แต่ยังไม่ overdue
        return $query->where('due_date', '>=', now())
                     ->where('due_date', '<=', now()->addDays(2))
                     ->whereNotIn('status', ['completed', 'cancelled']);
    }

    // Accessors
    public function getProgressPercentageAttribute()
    {
        if ($this->total_quantity == 0) return 0;
        return round(($this->completed_quantity / $this->total_quantity) * 100, 2);
    }

    public function getIsOverdueAttribute()
    {
        return $this->due_date < now() && !in_array($this->status, ['completed', 'cancelled']);
    }

    public function getDurationDaysAttribute()
    {
        return $this->start_date->diffInDays($this->expected_completion_date);
    }

    public function getRemainingDaysAttribute()
    {
        if ($this->status === 'completed' || $this->status === 'cancelled') {
            return 0;
        }

        $remaining = now()->diffInDays($this->due_date, false);
        return $remaining < 0 ? 0 : $remaining;
    }

    // Mutators
    public function setStatusAttribute($value)
    {
        $this->attributes['status'] = $value;

        if ($value === 'completed' && !$this->actual_completion_date) {
            $this->attributes['actual_completion_date'] = now();
        }
    }
}
