<?php

namespace App\Models\MaxSupply;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;

class MaxSupply extends Model
{
    protected $fillable = [
        'code',
        'worksheet_id',
        'screen_id',
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
        'notes',
        'special_instructions',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'sizes' => 'array',
        'start_date' => 'date',
        'expected_completion_date' => 'date',
        'due_date' => 'date',
        'actual_completion_date' => 'date',
    ];

    /**
     * Relationship to the worksheet
     */
    public function worksheet(): BelongsTo
    {
        return $this->belongsTo('App\Models\NewWorksheet', 'worksheet_id', 'worksheet_id');
    }

    /**
     * Relationship to the screen
     */
    public function screen(): BelongsTo
    {
        return $this->belongsTo('App\Models\NewWorksheetScreen', 'screen_id', 'screen_id');
    }

    /**
     * Relationship to the creator
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    /**
     * Relationship to the updater
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by', 'id');
    }

    /**
     * Relationship to activity logs
     */
    public function activities(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Scope by production type
     */
    public function scopeByProductionType($query, $type)
    {
        return $query->where('production_type', $type);
    }

    /**
     * Scope by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope by date range
     */
    public function scopeByDateRange($query, $start, $end)
    {
        return $query->whereBetween('start_date', [$start, $end]);
    }

    /**
     * Get the progress percentage
     */
    public function getProgressPercentageAttribute()
    {
        if ($this->total_quantity == 0) return 0;
        return round(($this->completed_quantity / $this->total_quantity) * 100, 2);
    }

    /**
     * Check if the job is overdue
     */
    public function getIsOverdueAttribute()
    {
        return $this->due_date < now() && $this->status !== 'completed';
    }

    /**
     * Get the duration in days
     */
    public function getDurationDaysAttribute()
    {
        return $this->start_date->diffInDays($this->expected_completion_date);
    }
}
