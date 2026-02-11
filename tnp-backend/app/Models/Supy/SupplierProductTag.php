<?php

namespace App\Models\Supy;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SupplierProductTag extends Model
{
    protected $table = 'supplier_product_tags';
    protected $primaryKey = 'spt_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'spt_is_deleted' => 'bool',
    ];

    protected $fillable = [
        'spt_id',
        'spt_name',
        'spt_is_deleted',
    ];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(
            SupplierProduct::class,
            'supplier_product_tag_relations',
            'sptr_spt_id',
            'sptr_sp_id',
            'spt_id',
            'sp_id'
        );
    }
}
