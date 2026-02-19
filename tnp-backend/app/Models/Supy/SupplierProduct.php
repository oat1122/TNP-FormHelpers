<?php

namespace App\Models\Supy;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\MasterProductCategory;
use App\Models\User;

class SupplierProduct extends Model
{
    protected $table = 'supplier_products';
    protected $primaryKey = 'sp_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'sp_base_price' => 'decimal:2',
        'sp_price_thb' => 'decimal:2',
        'sp_exchange_rate' => 'decimal:6',
        'sp_exchange_date' => 'datetime',
        'sp_is_active' => 'bool',
        'sp_is_deleted' => 'bool',
    ];

    protected $fillable = [
        'sp_id',
        'sp_mpc_id', // Deprecated
        'sp_spc_id', // New category FK
        'sp_ss_id',
        'sp_name',
        'sp_description',
        'sp_sku',
        'sp_origin_country',
        'sp_supplier_name',
        'sp_supplier_contact',
        'sp_base_price',
        'sp_currency',
        'sp_price_thb',
        'sp_exchange_rate',
        'sp_exchange_date',
        'sp_unit',
        'sp_cover_image',
        'sp_production_time',
        'sp_is_active',
        'sp_is_deleted',
        'sp_created_by',
        'sp_updated_by',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(SupplierProductCategory::class, 'sp_spc_id', 'spc_id');
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(SupplierSeller::class, 'sp_ss_id', 'ss_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(SupplierProductImage::class, 'spi_sp_id', 'sp_id')
            ->orderBy('spi_sort_order');
    }

    public function coverImage(): HasMany
    {
        return $this->hasMany(SupplierProductImage::class, 'spi_sp_id', 'sp_id')
            ->where('spi_is_cover', true);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(
            SupplierProductTag::class,
            'supplier_product_tag_relations',
            'sptr_sp_id',
            'sptr_spt_id',
            'sp_id',
            'spt_id'
        );
    }

    public function priceTiers(): HasMany
    {
        return $this->hasMany(SupplierPriceTier::class, 'sptier_sp_id', 'sp_id')
            ->orderBy('sptier_sort_order');
    }

    public function options(): HasMany
    {
        return $this->hasMany(SupplierProductOption::class, 'spo_sp_id', 'sp_id');
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sp_created_by', 'user_uuid')
            ->select('user_uuid', 'username', 'user_nickname', 'user_firstname', 'user_lastname');
    }

    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sp_updated_by', 'user_uuid')
            ->select('user_uuid', 'username', 'user_nickname', 'user_firstname', 'user_lastname');
    }
}
