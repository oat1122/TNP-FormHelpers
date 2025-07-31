<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;
use App\Models\PricingRequest;

class Quotation extends Model
{
    use HasFactory;

    protected $table = 'quotations';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'quotation_no',
        'pricing_request_id',
        'customer_id',
        'status',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'total_amount',
        'deposit_amount',
        'remaining_amount',
        'payment_terms',
        'valid_until',
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
        'deposit_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'valid_until' => 'date',
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

    /**
     * Relationship: Quotation belongs to Customer
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'cus_id');
    }

    /**
     * Relationship: Quotation belongs to PricingRequest
     */
    public function pricingRequest(): BelongsTo
    {
        return $this->belongsTo(PricingRequest::class, 'pricing_request_id', 'pr_id');
    }

    /**
     * Relationship: Quotation has many items
     */
    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class, 'quotation_id', 'id');
    }

    /**
     * Relationship: Quotation belongs to creator
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_uuid');
    }

    /**
     * Relationship: Quotation belongs to updater
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by', 'user_uuid');
    }

    /**
     * Relationship: Quotation belongs to approver
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_uuid');
    }

    /**
     * Relationship: Quotation belongs to rejecter
     */
    public function rejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by', 'user_uuid');
    }

    /**
     * Relationship: Quotation has many invoices
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'quotation_id', 'id');
    }

    /**
     * Relationship: Quotation has many status history
     */
    public function statusHistory(): HasMany
    {
        return $this->hasMany(DocumentStatusHistory::class, 'document_id', 'id')
                    ->where('document_type', 'quotation');
    }

    /**
     * Relationship: Quotation has many attachments
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(DocumentAttachment::class, 'document_id', 'id')
                    ->where('document_type', 'quotation');
    }

    /**
     * Scope: Filter by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Filter by customer
     */
    public function scopeByCustomer($query, $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    /**
     * Check if quotation can be edited
     */
    public function canEdit(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_PENDING_REVIEW]);
    }

    /**
     * Check if quotation can be approved
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
        $this->remaining_amount = $this->total_amount - $this->deposit_amount;
    }

    /**
     * Check if quotation is expired
     */
    public function isExpired(): bool
    {
        return $this->valid_until && $this->valid_until->isPast();
    }

    /**
     * Get days until expiry
     */
    public function getDaysUntilExpiry(): ?int
    {
        if (!$this->valid_until) {
            return null;
        }

        return max(0, now()->diffInDays($this->valid_until, false));
    }

    /**
     * Get status label in Thai
     */
    public function getStatusLabelAttribute(): string
    {
        $labels = [
            self::STATUS_DRAFT => 'ฉบับร่าง',
            self::STATUS_PENDING_REVIEW => 'รอตรวจสอบ',
            self::STATUS_APPROVED => 'อนุมัติแล้ว',
            self::STATUS_REJECTED => 'ไม่อนุมัติ',
            self::STATUS_COMPLETED => 'เสร็จสิ้น'
        ];

        return $labels[$this->status] ?? $this->status;
    }

    /**
     * Scope: Filter by date range
     */
    public function scopeDateRange($query, $from, $to)
    {
        if ($from) {
            $query->whereDate('created_at', '>=', $from);
        }
        
        if ($to) {
            $query->whereDate('created_at', '<=', $to);
        }

        return $query;
    }

    /**
     * Scope: Search by keywords
     */
    public function scopeSearch($query, $search)
    {
        if (empty($search)) {
            return $query;
        }

        $search = '%' . $search . '%';
        
        return $query->where(function ($q) use ($search) {
            $q->where('quotation_no', 'like', $search)
              ->orWhere('remarks', 'like', $search)
              ->orWhereHas('customer', function ($customerQuery) use ($search) {
                  $customerQuery->where('cus_firstname', 'like', $search)
                               ->orWhere('cus_lastname', 'like', $search)
                               ->orWhere('cus_company', 'like', $search);
              });
        });
    }

    /**
     * Scope: Filter by approved status
     */
    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    /**
     * Scope: Filter by pending review
     */
    public function scopePendingReview($query)
    {
        return $query->where('status', self::STATUS_PENDING_REVIEW);
    }

    /**
     * Scope: Filter expired quotations
     */
    public function scopeExpired($query)
    {
        return $query->where('valid_until', '<', now());
    }

    /**
     * Scope: Filter valid quotations
     */
    public function scopeValid($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('valid_until')
              ->orWhere('valid_until', '>=', now());
        });
    }

    /**
     * Get all available statuses
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_DRAFT => 'ฉบับร่าง',
            self::STATUS_PENDING_REVIEW => 'รอตรวจสอบ',
            self::STATUS_APPROVED => 'อนุมัติแล้ว',
            self::STATUS_REJECTED => 'ไม่อนุมัติ',
            self::STATUS_COMPLETED => 'เสร็จสิ้น'
        ];
    }
}
