<?php

namespace App\Models\Supy;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class SupplierSeller extends Model
{
    protected $table = 'supplier_sellers';
    protected $primaryKey = 'ss_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'ss_is_deleted' => 'bool',
    ];

    protected $fillable = [
        'ss_id',
        'ss_company_name',
        'ss_tax_id',
        'ss_phone',
        'ss_country',
        'ss_address',
        'ss_contact_person',
        'ss_remark',
        'ss_is_deleted',
        'ss_created_by',
        'ss_updated_by',
    ];

    public function phoneLogs(): HasMany
    {
        return $this->hasMany(SupplierSellerPhoneLog::class, 'sspl_ss_id', 'ss_id')
            ->orderByDesc('created_at');
    }

    public function products(): HasMany
    {
        return $this->hasMany(SupplierProduct::class, 'sp_ss_id', 'ss_id');
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ss_created_by', 'user_uuid')
            ->select('user_uuid', 'username', 'user_nickname');
    }

    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ss_updated_by', 'user_uuid')
            ->select('user_uuid', 'username', 'user_nickname');
    }
}
