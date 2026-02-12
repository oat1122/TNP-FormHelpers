<?php

namespace App\Models\Supy;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class SupplierSellerPhoneLog extends Model
{
    protected $table = 'supplier_seller_phone_logs';
    protected $primaryKey = 'sspl_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'sspl_id',
        'sspl_ss_id',
        'sspl_old_phone',
        'sspl_new_phone',
        'sspl_changed_by',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function seller(): BelongsTo
    {
        return $this->belongsTo(SupplierSeller::class, 'sspl_ss_id', 'ss_id');
    }

    public function changedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sspl_changed_by', 'user_uuid')
            ->select('user_uuid', 'username', 'user_nickname');
    }
}
