<?php

namespace App\Models\Supy;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierProductOptionTier extends Model
{
    use HasFactory;

    protected $table = 'supplier_product_option_tiers';
    protected $primaryKey = 'spot_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'spot_id',
        'spot_spo_id',
        'spot_min_qty',
        'spot_max_qty',
        'spot_price',
        'spot_discount',
    ];

    protected $casts = [
        'spot_min_qty' => 'integer',
        'spot_max_qty' => 'integer',
        'spot_price' => 'decimal:2',
        'spot_discount' => 'decimal:2',
    ];

    public function option()
    {
        return $this->belongsTo(SupplierProductOption::class, 'spot_spo_id', 'spo_id');
    }
}
