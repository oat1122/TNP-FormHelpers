<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaxSupplyLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'max_supply_id',
        'action',
        'old_data',
        'new_data',
        'description',
        'user_id',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_data' => 'array',
        'new_data' => 'array',
    ];

    // Relationships
    public function maxSupply(): BelongsTo
    {
        return $this->belongsTo(MaxSupply::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // Accessors
    public function getFormattedChangesAttribute()
    {
        if ($this->action === 'updated' && $this->old_data && $this->new_data) {
            $changes = [];
            foreach ($this->new_data as $key => $newValue) {
                $oldValue = $this->old_data[$key] ?? null;
                if ($oldValue !== $newValue) {
                    $changes[$key] = [
                        'from' => $oldValue,
                        'to' => $newValue
                    ];
                }
            }
            return $changes;
        }
        return [];
    }
}
