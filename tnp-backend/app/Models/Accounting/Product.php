<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    // Use master_product_categories table as products don't have dedicated table
    protected $table = 'master_product_categories';
    protected $primaryKey = 'mpc_id';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'mpc_name',
        'mpc_remark',
        'mpc_is_deleted'
    ];

    protected $casts = [
        'mpc_is_deleted' => 'boolean'
    ];

    // Accessor methods to maintain compatibility with accounting system
    public function getIdAttribute()
    {
        return $this->mpc_id;
    }

    public function getNameAttribute()
    {
        return $this->mpc_name;
    }

    public function getDescriptionAttribute()
    {
        return $this->mpc_remark;
    }

    public function getIsActiveAttribute()
    {
        return !$this->mpc_is_deleted;
    }

    public function getPriceAttribute()
    {
        return 0.00; // Default price, can be overridden
    }

    public function getCostAttribute() 
    {
        return 0.00; // Default cost, can be overridden
    }

    public function getUnitAttribute()
    {
        return 'unit'; // Default unit
    }

    // Relationships
    public function quotationItems()
    {
        return $this->hasMany(QuotationItem::class, 'product_id', 'mpc_id');
    }

    public function invoiceItems()
    {
        return $this->hasMany(InvoiceItem::class, 'product_id', 'mpc_id');
    }

    public function receiptItems()
    {
        return $this->hasMany(ReceiptItem::class, 'product_id', 'mpc_id');
    }

    public function deliveryNoteItems()
    {
        return $this->hasMany(DeliveryNoteItem::class, 'product_id', 'mpc_id');
    }

    public function scopeActive($query)
    {
        return $query->where('mpc_is_deleted', false);
    }
}
