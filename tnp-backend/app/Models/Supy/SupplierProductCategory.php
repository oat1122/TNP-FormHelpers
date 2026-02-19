<?php

namespace App\Models\Supy;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupplierProductCategory extends Model
{
    protected $table = 'supplier_product_categories';
    protected $primaryKey = 'spc_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'spc_is_deleted' => 'bool',
    ];

    protected $fillable = [
        'spc_id',
        'spc_name',
        'spc_sku_prefix',
        'spc_remark',
        'spc_is_deleted',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(SupplierProduct::class, 'sp_spc_id', 'spc_id');
    }
}
