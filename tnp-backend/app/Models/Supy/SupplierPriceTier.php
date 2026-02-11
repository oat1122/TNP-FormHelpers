<?php

namespace App\Models\Supy;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierPriceTier extends Model
{
    protected $table = 'supplier_price_tiers';
    protected $primaryKey = 'sptier_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'sptier_min_qty' => 'integer',
        'sptier_max_qty' => 'integer',
        'sptier_price' => 'decimal:2',
        'sptier_is_auto' => 'bool',
        'sptier_sort_order' => 'integer',
    ];

    protected $fillable = [
        'sptier_id',
        'sptier_sp_id',
        'sptier_min_qty',
        'sptier_max_qty',
        'sptier_price',
        'sptier_is_auto',
        'sptier_sort_order',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(SupplierProduct::class, 'sptier_sp_id', 'sp_id');
    }
}
