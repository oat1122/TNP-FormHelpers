<?php

namespace App\Models\Supy;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierProductOption extends Model
{
    use HasFactory;
    
    protected $table = 'supplier_product_options';
    protected $primaryKey = 'spo_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'spo_id',
        'spo_sp_id',
        'spo_name',
        'spo_is_active',
    ];

    protected $casts = [
        'spo_is_active' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(SupplierProduct::class, 'spo_sp_id', 'sp_id');
    }

    public function tiers()
    {
        return $this->hasMany(SupplierProductOptionTier::class, 'spot_spo_id', 'spo_id')
            ->orderBy('spot_min_qty');
    }
}
