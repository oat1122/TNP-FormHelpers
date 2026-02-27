<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class RecallStatusHistory extends Model
{
    protected $table = 'recall_status_histories';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    // We only use created_at from the migration
    public const UPDATED_AT = null;

    protected $casts = [
        'snapshot_date' => 'date',
        'cd_last_datetime' => 'datetime',
        'days_overdue' => 'integer',
        'manage_by' => 'integer'
    ];

    protected $fillable = [
        'snapshot_date',
        'customer_id',
        'customer_name',
        'customer_group_id',
        'source',
        'manage_by',
        'recall_status',
        'cd_last_datetime',
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

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manage_by', 'user_id');
    }
}
