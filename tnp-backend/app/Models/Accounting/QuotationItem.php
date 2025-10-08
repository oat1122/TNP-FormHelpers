<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * QuotationItem Model
 * รายการสินค้าในใบเสนอราคา
 */
class QuotationItem extends Model
{
    protected $table = 'quotation_items';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'quotation_id',
        'pricing_request_id',
        'item_name',
        'item_description',
        'sequence_order',
        'pattern',
        'fabric_type',
        'color',
        'size',
        'unit_price',
        'quantity',
        'unit',
        'discount_percentage',
        'discount_amount',
        'notes',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'quantity' => 'integer',
        'discount_percentage' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'sequence_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Append computed attributes when serializing
    protected $appends = [
        'subtotal',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'id');
    }

    public function pricingRequest(): BelongsTo
    {
        return $this->belongsTo(\App\Models\PricingRequest::class, 'pricing_request_id', 'pr_id');
    }

    /**
     * Computed subtotal for an item: (unit_price * quantity) - discount
     * If discount_amount missing, falls back to discount_percentage.
     */
    public function getSubtotalAttribute()
    {
        $unitPrice = (float) ($this->unit_price ?? 0);
        $qty = (int) ($this->quantity ?? 0);
        $gross = $unitPrice * $qty;

        $discountAmount = (float) ($this->discount_amount ?? 0);
        if ($discountAmount <= 0 && !is_null($this->discount_percentage)) {
            $discountAmount = $gross * ((float) $this->discount_percentage) / 100.0;
        }

        $subtotal = $gross - $discountAmount;
        return $subtotal < 0 ? 0 : round($subtotal, 2);
    }
}

