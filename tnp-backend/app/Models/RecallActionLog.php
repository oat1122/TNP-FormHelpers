<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class RecallActionLog extends Model
{
    protected $table = 'recall_action_logs';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    // Model only uses created_at
    public const UPDATED_AT = null;

    protected $casts = [
        'previous_datetime' => 'datetime',
        'new_datetime' => 'datetime',
        'was_overdue' => 'boolean',
        'days_overdue' => 'integer'
    ];

    protected $fillable = [
        'customer_id',
        'user_id',
        'previous_datetime',
        'new_datetime',
        'recall_note',
        'customer_group_id',
        'was_overdue',
        'days_overdue'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid()->toString();
            }
        });
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(MasterCustomer::class, 'customer_id', 'cus_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
