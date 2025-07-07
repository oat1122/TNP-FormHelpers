<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaxSupply extends Model
{
    use HasFactory;

    protected $fillable = [
        'worksheet_id',
        'production_code',
        'customer_name',
        'product_name',
        'quantity',
        'print_points',
        'start_date',
        'end_date',
        'status',
        'priority',
        'notes',
        'additional_data',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'print_points' => 'decimal:2',
        'additional_data' => 'array',
        'quantity' => 'integer',
    ];

    // Boot method to generate production code automatically
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($maxSupply) {
            if (empty($maxSupply->production_code)) {
                $maxSupply->production_code = 'MS-' . date('Ymd') . '-' . str_pad(
                    static::whereDate('created_at', today())->count() + 1,
                    4,
                    '0',
                    STR_PAD_LEFT
                );
            }
        });

        static::updated(function ($maxSupply) {
            // Log changes
            $maxSupply->logChanges();
        });
    }

    // Relationships
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(MaxSupplyLog::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(MaxSupplyFile::class);
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('start_date', [$startDate, $endDate]);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    // Methods
    public function logChanges()
    {
        if ($this->isDirty()) {
            MaxSupplyLog::create([
                'max_supply_id' => $this->id,
                'action' => 'updated',
                'old_data' => $this->getOriginal(),
                'new_data' => $this->getAttributes(),
                'description' => 'Record updated',
                'user_id' => auth()->id() ?? $this->updated_by,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }
    }

    public function updateStatus($status, $userId = null)
    {
        $oldStatus = $this->status;
        $this->status = $status;
        $this->updated_by = $userId ?? auth()->id();
        $this->save();

        // Log status change
        MaxSupplyLog::create([
            'max_supply_id' => $this->id,
            'action' => 'status_changed',
            'old_data' => ['status' => $oldStatus],
            'new_data' => ['status' => $status],
            'description' => "Status changed from {$oldStatus} to {$status}",
            'user_id' => $this->updated_by,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    // Accessors
    public function getDurationAttribute()
    {
        return $this->start_date->diffInDays($this->end_date) + 1;
    }

    public function getStatusColorAttribute()
    {
        return match($this->status) {
            'pending' => 'yellow',
            'in_progress' => 'blue',
            'completed' => 'green',
            'cancelled' => 'red',
            default => 'gray'
        };
    }

    public function getPriorityColorAttribute()
    {
        return match($this->priority) {
            'low' => 'green',
            'medium' => 'yellow',
            'high' => 'orange',
            'urgent' => 'red',
            default => 'gray'
        };
    }
}
