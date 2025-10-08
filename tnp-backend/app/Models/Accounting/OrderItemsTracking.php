<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use App\Models\User;
use App\Models\PricingRequest;

/**
 * Class OrderItemsTracking
 * 
 * @property string $id
 * @property string|null $quotation_id
 * @property string|null $pricing_request_id
 * @property string|null $work_name
 * @property string|null $fabric_type
 * @property string|null $pattern
 * @property string|null $color
 * @property string|null $sizes
 * @property int $ordered_quantity
 * @property int $delivered_quantity
 * @property int $remaining_quantity
 * @property int $returned_quantity
 * @property float $unit_price
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class OrderItemsTracking extends Model
{
    protected $table = 'order_items_tracking';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'quotation_id',
        'pricing_request_id',
        'work_name',
        'fabric_type',
        'pattern',
        'color',
        'sizes',
        'ordered_quantity',
        'delivered_quantity',
        'returned_quantity',
        'unit_price'
    ];

    protected $casts = [
        'ordered_quantity' => 'integer',
        'delivered_quantity' => 'integer',
        'returned_quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Generate UUID when creating
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    /**
     * Relationship: OrderItemsTracking belongs to Quotation
     * @return BelongsTo<Quotation, OrderItemsTracking>
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'id');
    }

    /**
     * Relationship: OrderItemsTracking belongs to PricingRequest
     * @return BelongsTo<PricingRequest, OrderItemsTracking>
     */
    public function pricingRequest(): BelongsTo
    {
        return $this->belongsTo(PricingRequest::class, 'pricing_request_id', 'pr_id');
    }

    /**
     * Get remaining quantity (computed attribute from database)
     */
    public function getRemainingQuantityAttribute(): int
    {
        return $this->ordered_quantity - $this->delivered_quantity;
    }

    /**
     * Get delivery progress percentage
     */
    public function getDeliveryProgressAttribute(): float
    {
        if ($this->ordered_quantity <= 0) {
            return 0;
        }
        
        return round(($this->delivered_quantity / $this->ordered_quantity) * 100, 2);
    }

    /**
     * Calculate total order value
     */
    public function getTotalOrderValueAttribute(): float
    {
        return $this->ordered_quantity * $this->unit_price;
    }

    /**
     * Calculate delivered value
     */
    public function getDeliveredValueAttribute(): float
    {
        return $this->delivered_quantity * $this->unit_price;
    }

    /**
     * Calculate remaining value
     */
    public function getRemainingValueAttribute(): float
    {
        return $this->remaining_quantity * $this->unit_price;
    }

    /**
     * Scope: Filter by quotation
     * @param Builder<OrderItemsTracking> $query
     * @return Builder<OrderItemsTracking>
     */
    public function scopeQuotation(Builder $query, string $quotationId): Builder
    {
        return $query->where('quotation_id', $quotationId);
    }

    /**
     * Scope: Filter by pricing request
     * @param Builder<OrderItemsTracking> $query
     * @return Builder<OrderItemsTracking>
     */
    public function scopePricingRequest(Builder $query, string $pricingRequestId): Builder
    {
        return $query->where('pricing_request_id', $pricingRequestId);
    }

    /**
     * Scope: Items with remaining quantity
     * @param Builder<OrderItemsTracking> $query
     * @return Builder<OrderItemsTracking>
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->whereRaw('ordered_quantity > delivered_quantity');
    }

    /**
     * Scope: Fully delivered items
     * @param Builder<OrderItemsTracking> $query
     * @return Builder<OrderItemsTracking>
     */
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->whereRaw('ordered_quantity <= delivered_quantity');
    }

    /**
     * Record partial delivery
     */
    public function recordDelivery(int $quantity, ?string $notes = null): self
    {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Delivery quantity must be greater than 0');
        }
        
        if ($this->delivered_quantity + $quantity > $this->ordered_quantity) {
            throw new \InvalidArgumentException('Total delivered quantity cannot exceed ordered quantity');
        }
        
        $this->delivered_quantity += $quantity;
        $this->save();
        
        // Log the delivery
        DocumentHistory::logAction(
            'order_tracking',
            $this->id,
            'partial_delivery',
            auth()->user()->user_uuid ?? null,
            "ส่งของจำนวน {$quantity} ชิ้น. {$notes}"
        );
        
        return $this;
    }

    /**
     * Record return
     */
    public function recordReturn(int $quantity, ?string $notes = null): self
    {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Return quantity must be greater than 0');
        }
        
        if ($this->returned_quantity + $quantity > $this->delivered_quantity) {
            throw new \InvalidArgumentException('Total returned quantity cannot exceed delivered quantity');
        }
        
        $this->returned_quantity += $quantity;
        $this->save();
        
        // Log the return
        DocumentHistory::logAction(
            'order_tracking',
            $this->id,
            'item_return',
            auth()->user()->user_uuid ?? null,
            "รับคืนสินค้าจำนวน {$quantity} ชิ้น. {$notes}"
        );
        
        return $this;
    }

    /**
     * Check if order is fully delivered
     */
    public function isFullyDelivered(): bool
    {
        return $this->delivered_quantity >= $this->ordered_quantity;
    }

    /**
     * Check if order has pending delivery
     */
    public function hasPendingDelivery(): bool
    {
        return $this->delivered_quantity < $this->ordered_quantity;
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute(): string
    {
        if ($this->isFullyDelivered()) {
            return 'ส่งครบแล้ว';
        } elseif ($this->delivered_quantity > 0) {
            return 'ส่งบางส่วน';
        } else {
            return 'ยังไม่ส่ง';
        }
    }
}
