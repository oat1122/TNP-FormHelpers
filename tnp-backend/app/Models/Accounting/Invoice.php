<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;

class Invoice extends Model
{
    use HasFactory;

    protected $table = 'invoices';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'invoice_no',
        'quotation_id',
        'customer_id',
        'status',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'total_amount',
        'paid_amount',
        'remaining_amount',
        'credit_term_days',
        'due_date',
        'payment_status',
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
        'paid_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'credit_term_days' => 'integer',
        'due_date' => 'date',
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

    // Payment status constants
    const PAYMENT_STATUS_UNPAID = 'unpaid';
    const PAYMENT_STATUS_PARTIAL = 'partial';
    const PAYMENT_STATUS_PAID = 'paid';

    /**
     * Relationship: Invoice belongs to Customer
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'cus_id');
    }

    /**
     * Relationship: Invoice belongs to Quotation
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'id');
    }

    /**
     * Relationship: Invoice has many items
     */
    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class, 'invoice_id', 'id');
    }

    /**
     * Relationship: Invoice belongs to creator
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to updater
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to approver
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to rejecter
     */
    public function rejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice has many receipts
     */
    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class, 'invoice_id', 'id');
    }

    /**
     * Relationship: Invoice has many status history
     */
    public function statusHistory(): HasMany
    {
        return $this->hasMany(DocumentStatusHistory::class, 'document_id', 'id')
                    ->where('document_type', 'invoice');
    }

    /**
     * Relationship: Invoice has many attachments
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(DocumentAttachment::class, 'document_id', 'id')
                    ->where('document_type', 'invoice');
    }

    /**
     * Scope: Filter by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Filter by payment status
     */
    public function scopeByPaymentStatus($query, $paymentStatus)
    {
        return $query->where('payment_status', $paymentStatus);
    }

    /**
     * Check if invoice can be edited
     */
    public function canEdit(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_PENDING_REVIEW]);
    }

    /**
     * Check if invoice can be approved
     */
    public function canApprove(): bool
    {
        return $this->status === self::STATUS_PENDING_REVIEW;
    }

    /**
     * Calculate due date based on credit terms
     */
    public function calculateDueDate(): void
    {
        if ($this->credit_term_days && $this->created_at) {
            $this->due_date = $this->created_at->addDays($this->credit_term_days);
        }
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
        $this->remaining_amount = $this->total_amount - $this->paid_amount;
    }

    /**
     * Update payment status based on paid amount
     */
    public function updatePaymentStatus(): void
    {
        if ($this->paid_amount <= 0) {
            $this->payment_status = self::PAYMENT_STATUS_UNPAID;
        } elseif ($this->paid_amount >= $this->total_amount) {
            $this->payment_status = self::PAYMENT_STATUS_PAID;
        } else {
            $this->payment_status = self::PAYMENT_STATUS_PARTIAL;
        }
    }
}
