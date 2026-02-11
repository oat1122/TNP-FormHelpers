<?php

namespace App\Models\Supy;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierProductImage extends Model
{
    protected $table = 'supplier_product_images';
    protected $primaryKey = 'spi_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $casts = [
        'spi_is_cover' => 'bool',
        'spi_sort_order' => 'integer',
        'created_at' => 'datetime',
    ];

    protected $fillable = [
        'spi_id',
        'spi_sp_id',
        'spi_file_path',
        'spi_original_name',
        'spi_is_cover',
        'spi_sort_order',
        'spi_uploaded_by',
        'created_at',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(SupplierProduct::class, 'spi_sp_id', 'sp_id');
    }
}
