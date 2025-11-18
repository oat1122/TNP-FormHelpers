<?php

namespace App\Models\Accounting;

use App\Services\Accounting\PdfCacheService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use App\Models\MasterCustomer;
use App\Models\User;
use App\Models\Company;

/**
 * Class Receipt
 * 
 * @property string $id
 * @property string $number
 * @property string|null $invoice_id
 * @property string|null $customer_id
 * @property string|null $customer_company
 * @property string|null $customer_tax_id
 * @property string|null $customer_address
 * @property string|null $customer_zip_code
 * @property string|null $customer_tel_1
 * @property string|null $customer_email
 * @property string|null $customer_firstname
 * @property string|null $customer_lastname
 * @property string|null $work_name
 * @property string|null $quantity
 * @property string $type
 * @property string $status
 * @property float $subtotal
 * @property float $tax_amount
 * @property float $total_amount
 * @property string|null $payment_method
 * @property string|null $payment_reference
 * @property string|null $tax_invoice_number
 * @property string|null $notes
 * @property string|null $issued_by
 * @property string|null $approved_by
 * @property \Carbon\Carbon|null $approved_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property string|null $payment_date
 * @property float|null $payment_amount
 * @property string|null $bank_name
 * @property string|null $receipt_type
 * @property float|null $vat_rate
 * @property float|null $vat_amount
 * @property string|null $created_by
 * @property string|null $updated_by
 * @property string|null $submitted_by
 * @property \Carbon\Carbon|null $submitted_at
 * @property string|null $rejected_by
 * @property \Carbon\Carbon|null $rejected_at
 */
class Receipt extends Model
{
    protected $table = 'receipts';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'company_id',
        'number',
        'invoice_id',
        'customer_id',
        'customer_company',
        'customer_tax_id',
        'customer_address',
        'customer_zip_code',
        'customer_tel_1',
        'customer_email',
        'customer_firstname',
        'customer_lastname',
        'work_name',
        'quantity',
        'type',
        'status',
        'subtotal',
        'tax_amount',
        'total_amount',
        'payment_method',
        'payment_reference',
        'tax_invoice_number',
        'notes',
        'issued_by',
        'approved_by',
        'approved_at',
        'payment_date',
        'payment_amount',
        'bank_name',
        'receipt_type',
        'vat_rate',
        'vat_amount',
        'created_by',
        'updated_by',
        'submitted_by',
        'submitted_at',
        'rejected_by',
        'rejected_at'
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'payment_amount' => 'decimal:2',
        'vat_rate' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'submitted_at' => 'datetime',
        'rejected_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Generate UUID when creating + PDF cache invalidation
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
            if (empty($model->company_id)) {
                $model->company_id = optional(Company::where('is_active', true)->first())->id;
            }
        });
        
        // Invalidate PDF cache when receipt is updated
        static::updated(function ($receipt) {
            try {
                $cacheService = app(PdfCacheService::class);
                $cacheService->invalidate('receipt', $receipt->id);
                Log::info("Receipt updated - PDF cache invalidated", ['receipt_id' => $receipt->id]);
            } catch (\Exception $e) {
                Log::warning("Failed to invalidate PDF cache on receipt update: " . $e->getMessage());
            }
        });
        
        // Invalidate PDF cache when receipt is deleted
        static::deleted(function ($receipt) {
            try {
                $cacheService = app(PdfCacheService::class);
                $cacheService->invalidate('receipt', $receipt->id);
                Log::info("Receipt deleted - PDF cache invalidated", ['receipt_id' => $receipt->id]);
            } catch (\Exception $e) {
                Log::warning("Failed to invalidate PDF cache on receipt delete: " . $e->getMessage());
            }
        });
    }

    /**
     * Relationship: Receipt belongs to Invoice
     * @return BelongsTo<Invoice, Receipt>
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id', 'id');
    }

    /**
     * Relationship: Receipt belongs to Customer
     * @return BelongsTo<MasterCustomer, Receipt>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(MasterCustomer::class, 'customer_id', 'cus_id');
    }

    /**
     * Relationship: Receipt belongs to Issuer
     * @return BelongsTo<User, Receipt>
     */
    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by', 'user_uuid');
    }

    /**
     * Relationship: Receipt belongs to Approver
     * @return BelongsTo<User, Receipt>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_uuid');
    }

    /**
     * Relationship: Receipt has many Delivery Notes
     * @return HasMany<DeliveryNote>
     */
    public function deliveryNotes(): HasMany
    {
        return $this->hasMany(DeliveryNote::class, 'receipt_id', 'id');
    }

    /**
     * Relationship: Receipt has many Document History
     * @return HasMany<DocumentHistory>
     */
    public function documentHistory(): HasMany
    {
        return $this->hasMany(DocumentHistory::class, 'document_id', 'id')
                    ->where('document_type', 'receipt');
    }

    /**
     * Relationship: Receipt has many Document Attachments
     * @return HasMany<DocumentAttachment>
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(DocumentAttachment::class, 'document_id', 'id')
                    ->where('document_type', 'receipt');
    }

    /**
     * Scope: Filter by type
     * @param Builder<Receipt> $query
     * @return Builder<Receipt>
     */
    public function scopeType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    /**
     * Scope: Filter by status
     * @param Builder<Receipt> $query
     * @return Builder<Receipt>
     */
    public function scopeStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Filter by customer
     * @param Builder<Receipt> $query
     * @return Builder<Receipt>
     */
    public function scopeCustomer(Builder $query, string $customerId): Builder
    {
        return $query->where('customer_id', $customerId);
    }

    /**
     * Auto-generate receipt number based on type
     */
    public static function generateReceiptNumber(string $companyId, string $type = 'receipt'): string
    {
        return app(\App\Services\Support\DocumentNumberService::class)
            ->next($companyId, $type);
    }

    /**
     * Auto-generate tax invoice number
     */
    public function generateTaxInvoiceNumber(): self
    {
        if ($this->type === 'tax_invoice' || $this->type === 'full_tax_invoice') {
            $this->tax_invoice_number = app(\App\Services\Support\DocumentNumberService::class)
                ->next($this->company_id, 'tax_invoice');
            $this->save();
        }
        return $this;
    }

    /**
     * Get customer full name
     */
    public function getCustomerFullNameAttribute(): string
    {
        return trim($this->customer_firstname . ' ' . $this->customer_lastname);
    }

    /**
     * Check if receipt is approved
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if receipt can be converted to delivery note
     */
    public function canConvertToDeliveryNote(): bool
    {
        return in_array($this->status, ['approved', 'sent']);
    }

    /**
     * Get type label in Thai
     */
    public function getTypeLabelAttribute(): string
    {
        $labels = [
            'receipt' => 'ใบเสร็จรับเงิน',
            'tax_invoice' => 'ใบกำกับภาษี',
            'full_tax_invoice' => 'ใบเสร็จรับเงิน/ใบกำกับภาษี'
        ];
        
        return $labels[$this->type] ?? $this->type;
    }
}
