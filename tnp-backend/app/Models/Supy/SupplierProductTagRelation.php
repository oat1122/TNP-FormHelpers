<?php

namespace App\Models\Supy;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierProductTagRelation extends Model
{
    protected $table = 'supplier_product_tag_relations';
    protected $primaryKey = 'sptr_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'sptr_id',
        'sptr_sp_id',
        'sptr_spt_id',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(SupplierProduct::class, 'sptr_sp_id', 'sp_id');
    }

    public function tag(): BelongsTo
    {
        return $this->belongsTo(SupplierProductTag::class, 'sptr_spt_id', 'spt_id');
    }
}
