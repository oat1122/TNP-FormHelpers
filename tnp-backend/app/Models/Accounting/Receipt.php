<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;

class Receipt extends Model
{
    use HasFactory;

    protected $table = 'receipts';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'receipt_no',
        'tax_invoice_no',
        'invoice_id',
        'customer_id',
        'status',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'total_amount',
        'payment_method',
        'payment_reference',
        'payment_date',
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
        'subtotal' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'payment_date' => 'date',
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

    // Payment method constants
    const PAYMENT_METHOD_CASH = 'cash';
    const PAYMENT_METHOD_BANK_TRANSFER = 'bank_transfer';
    const PAYMENT_METHOD_CHEQUE = 'cheque';
    const PAYMENT_METHOD_CREDIT_CARD = 'credit_card';

    /**
     * Relationship: Receipt belongs to Customer
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'cus_id');
    }

    /**
     * Relationship: Receipt belongs to Invoice
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id', 'id');
    }

    /**
     * Relationship: Receipt has many items
     */
    public function items(): HasMany
    {
        return $this->hasMany(ReceiptItem::class, 'receipt_id', 'id');
    }

    /**
     * Relationship: Receipt belongs to creator
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_uuid');
    }

    /**
     * Relationship: Receipt belongs to updater
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by', 'user_uuid');
    }

    /**
     * Relationship: Receipt belongs to approver
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_uuid');
    }

    /**
     * Relationship: Receipt belongs to rejecter
     */
    public function rejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by', 'user_uuid');
    }

    /**
     * Relationship: Receipt has many delivery notes
     */
    public function deliveryNotes(): HasMany
    {
        return $this->hasMany(DeliveryNote::class, 'receipt_id', 'id');
    }

    /**
     * Relationship: Receipt has many status history
     */
    public function statusHistory(): HasMany
    {
        return $this->hasMany(DocumentStatusHistory::class, 'document_id', 'id')
                    ->where('document_type', 'receipt');
    }

    /**
     * Relationship: Receipt has many attachments
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(DocumentAttachment::class, 'document_id', 'id')
                    ->where('document_type', 'receipt');
    }

    /**
     * Scope: Filter by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Filter by payment method
     */
    public function scopeByPaymentMethod($query, $paymentMethod)
    {
        return $query->where('payment_method', $paymentMethod);
    }

    /**
     * Check if receipt can be edited
     */
    public function canEdit(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_PENDING_REVIEW]);
    }

    /**
     * Check if receipt can be approved
     */
    public function canApprove(): bool
    {
        return $this->status === self::STATUS_PENDING_REVIEW;
    }

    /**
     * Calculate totals
     */
    public function calculateTotals(): void
    {
        $this->subtotal = $this->items->sum(function ($item) {
            return $item->quantity * $item->unit_price;
        });

        $this->tax_amount = $this->subtotal * ($this->tax_rate / 100);
        $this->total_amount = $this->subtotal + $this->tax_amount;
    }
}
