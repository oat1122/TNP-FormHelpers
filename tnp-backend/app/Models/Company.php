<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $table = 'companies';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'legal_name',
        'branch',
        'address',
        'tax_id',
        'phone',
        'is_active',
        'short_code',
        'account_name',
        'bank_name',
        'account_number',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    public function quotations(): HasMany { return $this->hasMany(\App\Models\Accounting\Quotation::class, 'company_id', 'id'); }
    public function invoices(): HasMany { return $this->hasMany(\App\Models\Accounting\Invoice::class, 'company_id', 'id'); }
    public function receipts(): HasMany { return $this->hasMany(\App\Models\Accounting\Receipt::class, 'company_id', 'id'); }
    public function deliveryNotes(): HasMany { return $this->hasMany(\App\Models\Accounting\DeliveryNote::class, 'company_id', 'id'); }
}
