<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;

class DeliveryNote extends Model
{
    use HasFactory;

    protected $table = 'delivery_notes';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'delivery_no',
        'receipt_id',
        'customer_id',
        'status',
        'delivery_date',
        'delivery_address',
        'contact_person',
        'contact_phone',
        'remarks',
        'created_by',
        'updated_by',
        'version_no',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason'
    ];

    protected $casts = [
        'delivery_date' => 'date',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Status constants
    const STATUS_DRAFT = 'draft';
    const STATUS_PENDING_REVIEW = 'pending_review';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_COMPLETED = 'completed';
    const STATUS_DELIVERED = 'delivered';

    /**
     * Relationship: DeliveryNote belongs to Customer
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'cus_id');
    }

    /**
     * Relationship: DeliveryNote belongs to Receipt
     */
    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class, 'receipt_id', 'id');
    }

    /**
     * Relationship: DeliveryNote has many items
     */
    public function items(): HasMany
    {
        return $this->hasMany(DeliveryNoteItem::class, 'delivery_note_id', 'id');
    }

    /**
     * Relationship: DeliveryNote belongs to creator
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_uuid');
    }

    /**
     * Relationship: DeliveryNote belongs to updater
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by', 'user_uuid');
    }

    /**
     * Relationship: DeliveryNote belongs to approver
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_uuid');
    }

    /**
     * Relationship: DeliveryNote belongs to rejecter
     */
    public function rejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by', 'user_uuid');
    }

    /**
     * Relationship: DeliveryNote has many status history
     */
    public function statusHistory(): HasMany
    {
        return $this->hasMany(DocumentStatusHistory::class, 'document_id', 'id')
                    ->where('document_type', 'delivery_note');
    }

    /**
     * Relationship: DeliveryNote has many attachments
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(DocumentAttachment::class, 'document_id', 'id')
                    ->where('document_type', 'delivery_note');
    }

    /**
     * Scope: Filter by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Filter by delivery date
     */
    public function scopeByDeliveryDate($query, $startDate, $endDate = null)
    {
        if ($endDate) {
            return $query->whereBetween('delivery_date', [$startDate, $endDate]);
        }
        return $query->whereDate('delivery_date', $startDate);
    }

    /**
     * Check if delivery note can be edited
     */
    public function canEdit(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_PENDING_REVIEW]);
    }

    /**
     * Check if delivery note can be approved
     */
    public function canApprove(): bool
    {
        return $this->status === self::STATUS_PENDING_REVIEW;
    }

    /**
     * Check if all items are fully delivered
     */
    public function isFullyDelivered(): bool
    {
        return $this->items->every(function ($item) {
            return $item->quantity_remaining <= 0;
        });
    }
}
