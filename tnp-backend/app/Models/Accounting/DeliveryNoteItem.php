<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DeliveryNoteItem extends Model
{
    use HasFactory;

    protected $table = 'delivery_note_items';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'delivery_note_id',
        'item_name',
        'item_description',
        'quantity_ordered',
        'quantity_delivered',
        'quantity_remaining',
        'unit',
        'item_order'
    ];

    protected $casts = [
        'quantity_ordered' => 'decimal:2',
        'quantity_delivered' => 'decimal:2',
        'quantity_remaining' => 'decimal:2',
        'item_order' => 'integer'
    ];

    /**
     * Relationship: DeliveryNoteItem belongs to DeliveryNote
     */
    public function deliveryNote(): BelongsTo
    {
        return $this->belongsTo(DeliveryNote::class, 'delivery_note_id', 'id');
    }

    /**
     * Calculate remaining quantity automatically
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($model) {
            $model->quantity_remaining = $model->quantity_ordered - $model->quantity_delivered;
        });
    }

    /**
     * Check if item is fully delivered
     */
    public function isFullyDelivered(): bool
    {
        return $this->quantity_remaining <= 0;
    }
}
