<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use App\Models\MasterCustomer;
use App\Models\User;
use App\Models\Company;
use App\Models\PricingRequest;

/**
 * Class Invoice
 * 
 * @property string $id
 * @property string $number
 * @property string|null $quotation_id
 * @property string|null $customer_id
 * @property string|null $customer_company
 * @property string|null $customer_tax_id
 * @property string|null $customer_address
 * @property string|null $customer_zip_code
 * @property string|null $customer_tel_1
 * @property string|null $customer_email
 * @property string|null $customer_firstname
 * @property string|null $customer_lastname
 * @property string|null $customer_snapshot
 * @property string|null $work_name
 * @property string|null $fabric_type
 * @property string|null $pattern
 * @property string|null $color
 * @property string|null $sizes
 * @property string|null $quantity
 * @property string $status
 * @property float $subtotal
 * @property float $tax_amount
 * @property float $total_amount
 * @property float $paid_amount
 * @property \Carbon\Carbon|null $due_date
 * @property string|null $payment_method
 * @property string|null $notes
 * @property string|null $document_header_type
 * @property string|null $created_by
 * @property string|null $inv_manage_by
 * @property string|null $approved_by
 * @property \Carbon\Carbon|null $approved_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Invoice extends Model
{
    protected $table = 'invoices';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'company_id',
        'number',
        'number_before',
        'number_after',
        'quotation_id',
        'reference_invoice_id',
        'reference_invoice_number',
        'primary_pricing_request_id',
        'primary_pricing_request_ids',
        'customer_id',
        'customer_company',
        'customer_tax_id',
        'customer_address',
        'customer_zip_code',
        'customer_tel_1',
        'customer_email',
        'customer_firstname',
        'customer_lastname',
    'customer_data_source',
        'customer_snapshot',
        'status',
        'status_before',
        'status_after',
        'type',
        'subtotal',
        'net_subtotal',
        'subtotal_before_vat',
        'tax_amount',
        'total_amount',
        'special_discount_percentage',
        'special_discount_amount',
        'has_vat',
        'vat_percentage',
        'pricing_mode',
        'vat_amount',
        'has_withholding_tax',
        'withholding_tax_percentage',
        'withholding_tax_amount',
        'final_total_amount',
        'deposit_percentage',
        'deposit_amount',
        'deposit_amount_before_vat',
    'deposit_display_order',
        'deposit_mode',
        'paid_amount',
        'due_date',
        'payment_method',
        'payment_terms',
        'notes',
        'signature_images',
        'sample_images',
    'evidence_files',
        'document_header_type',
        'created_by',
        'inv_manage_by',
        'updated_by',
        'submitted_by',
        'submitted_at',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'sent_by',
        'sent_at',
        'paid_at'
    ];

    /**
     * Default attribute values
     */
    protected $attributes = [
        'deposit_display_order' => 'after',
        'status' => 'draft',
        'status_before' => 'draft',
        'status_after' => 'draft',
    ];

    protected $casts = [
        'primary_pricing_request_ids' => 'array',
        'customer_snapshot' => 'array',
        'signature_images' => 'array',
        'sample_images' => 'array',
    'evidence_files' => 'array',
        'subtotal' => 'decimal:2',
        'net_subtotal' => 'decimal:2',
        'subtotal_before_vat' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'special_discount_percentage' => 'decimal:2',
        'special_discount_amount' => 'decimal:2',
        'vat_percentage' => 'decimal:2',
        'pricing_mode' => 'string',
        'vat_amount' => 'decimal:2',
        'withholding_tax_percentage' => 'decimal:2',
        'withholding_tax_amount' => 'decimal:2',
        'final_total_amount' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'deposit_amount_before_vat' => 'decimal:2',
    'deposit_display_order' => 'string',
        'paid_amount' => 'decimal:2',
        'has_vat' => 'boolean',
        'has_withholding_tax' => 'boolean',
    'customer_data_source' => 'string',
        'due_date' => 'date',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'sent_at' => 'datetime',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Generate UUID when creating
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            /** @var Invoice $model */
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
            if (empty($model->company_id)) {
                $model->company_id = optional(Company::where('is_active', true)->first())->id;
            }
            
            // Auto-set inv_manage_by from quotation's created_by if not set
            if (empty($model->inv_manage_by) && !empty($model->quotation_id)) {
                /** @var Quotation|null $quotation */
                $quotation = Quotation::find($model->quotation_id);
                if ($quotation && !empty($quotation->created_by)) {
                    $model->inv_manage_by = $quotation->created_by;
                }
            }
        });
        
        static::updating(function ($model) {
            /** @var Invoice $model */
            // Auto-sync inv_manage_by if quotation_id changed and inv_manage_by is empty
            if ($model->isDirty('quotation_id') && empty($model->inv_manage_by) && !empty($model->quotation_id)) {
                /** @var Quotation|null $quotation */
                $quotation = Quotation::find($model->quotation_id);
                if ($quotation && !empty($quotation->created_by)) {
                    $model->inv_manage_by = $quotation->created_by;
                }
            }
        });
    }

    /**
     * Relationship: Invoice belongs to Quotation
     * @return BelongsTo<Quotation, Invoice>
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'id');
    }

    /**
     * Relationship: Invoice has many InvoiceItems
     * @return HasMany<InvoiceItem>
     */
    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class, 'invoice_id')
                   ->orderBy('sequence_order');
    }

    /**
     * Relationship: Invoice belongs to primary pricing request
     * @return BelongsTo<PricingRequest, Invoice>
     */
    public function primaryPricingRequest(): BelongsTo
    {
        return $this->belongsTo(PricingRequest::class, 'primary_pricing_request_id', 'pr_id');
    }

    /**
     * Relationship: Invoice belongs to Customer
     * @return BelongsTo<MasterCustomer, Invoice>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(MasterCustomer::class, 'customer_id', 'cus_id');
    }

    /**
     * Relationship: Invoice belongs to Company
     * @return BelongsTo<Company, Invoice>
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id', 'id');
    }

    /**
     * Relationship: Invoice belongs to Reference Invoice (before-deposit invoice)
     * @return BelongsTo<Invoice, Invoice>
     */
    public function referenceInvoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'reference_invoice_id', 'id');
    }

    /**
     * Relationship: Invoice has many after-deposit invoices
     * @return HasMany<Invoice>
     */
    public function afterDepositInvoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'reference_invoice_id', 'id');
    }

    /**
     * Relationship: Invoice belongs to Creator
     * @return BelongsTo<User, Invoice>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to Updater
     * @return BelongsTo<User, Invoice>
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to Manager
     * @return BelongsTo<User, Invoice>
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inv_manage_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to Submitter
     * @return BelongsTo<User, Invoice>
     */
    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to Approver
     * @return BelongsTo<User, Invoice>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to Rejecter
     * @return BelongsTo<User, Invoice>
     */
    public function rejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to Sender
     * @return BelongsTo<User, Invoice>
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice has many Receipts
     * @return HasMany<Receipt>
     */
    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class, 'invoice_id', 'id');
    }

    /**
     * Relationship: Invoice has many Document History
     * @return HasMany<DocumentHistory>
     */
    public function documentHistory(): HasMany
    {
        return $this->hasMany(DocumentHistory::class, 'document_id', 'id')
                    ->where('document_type', 'invoice');
    }

    /**
     * Relationship: Invoice has many Document Attachments
     * @return HasMany<DocumentAttachment>
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(DocumentAttachment::class, 'document_id', 'id')
                    ->where('document_type', 'invoice');
    }

    /**
     * Scope: Filter by status
     * @param Builder<Invoice> $query
     * @return Builder<Invoice>
     */
    public function scopeStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Filter by customer
     * @param Builder<Invoice> $query
     * @return Builder<Invoice>
     */
    public function scopeCustomer(Builder $query, string $customerId): Builder
    {
        return $query->where('customer_id', $customerId);
    }

    /**
     * Scope: Overdue invoices
     * @param Builder<Invoice> $query
     * @return Builder<Invoice>
     */
    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('due_date', '<', now())
                    ->whereNotIn('status', ['fully_paid']);
    }

    /**
     * Auto-generate invoice number
     */
    public static function generateInvoiceNumber(string $companyId): string
    {
        return app(\App\Services\Support\DocumentNumberService::class)
            ->next($companyId, 'invoice');
    }

    /**
     * Auto-generate invoice number based on deposit display order
     */
    public static function generateInvoiceNumberByDepositMode(string $companyId, string $depositDisplayOrder = 'before'): string
    {
        $docType = $depositDisplayOrder === 'after' ? 'invoice_after' : 'invoice_before';
        return app(\App\Services\Support\DocumentNumberService::class)
            ->next($companyId, $docType);
    }

    /**
     * Generate and assign appropriate invoice numbers based on deposit mode
     */
    public function assignInvoiceNumbers(): void
    {
        $documentService = app(\App\Services\Support\DocumentNumberService::class);
        
        // Generate number for before-deposit
        $this->number_before = $documentService->nextInvoiceNumber($this->company_id, 'before');
        
        // If this is an after-deposit invoice, also generate after number
        if ($this->deposit_display_order === 'after' || $this->type === 'remaining') {
            $this->number_after = $documentService->nextInvoiceNumber($this->company_id, 'after');
            // Use the after number as the main number for after-deposit invoices
            $this->number = $this->number_after;
        } else {
            // Use the before number as the main number for before-deposit invoices
            $this->number = $this->number_before;
        }
    }

    /**
     * Get customer full name
     */
    public function getCustomerFullNameAttribute(): string
    {
        return trim($this->customer_firstname . ' ' . $this->customer_lastname);
    }

    /**
     * Calculate remaining amount after paid
     */
    public function getRemainingAmountAttribute(): float
    {
        return $this->final_total_amount - $this->paid_amount;
    }

    /**
     * Check if invoice is fully paid
     */
    public function isFullyPaid(): bool
    {
        return $this->paid_amount >= $this->final_total_amount;
    }

    /**
     * Check if invoice is overdue
     */
    public function isOverdue(): bool
    {
        return $this->due_date && $this->due_date < now() && !$this->isFullyPaid();
    }

    /**
     * Record payment
     */
    public function recordPayment(float $amount, ?string $method = null, ?string $reference = null): self
    {
        $this->paid_amount += $amount;
        
        if ($method) {
            $this->payment_method = $method;
        }
        
        // Update status based on payment
        if ($this->isFullyPaid()) {
            $this->status = 'fully_paid';
        } else {
            $this->status = 'partial_paid';
        }
        
        $this->save();
        
        return $this;
    }

    /**
     * Check if invoice can be converted to receipt
     */
    public function canConvertToReceipt(): bool
    {
        return in_array($this->status, ['approved', 'sent', 'partial_paid', 'fully_paid']);
    }

    /**
     * Sync inv_manage_by from related quotation's created_by
     */
    public function syncManagerFromQuotation(): bool
    {
        if ($this->quotation_id && $this->quotation) {
            $this->inv_manage_by = $this->quotation->created_by;
            $this->save();
            return true;
        }
        return false;
    }

    /**
     * Get UI status based on current deposit_display_order mode
     */
    public function getUiStatusAttribute(): string
    {
        $mode = $this->deposit_display_order === 'before' ? 'before' : 'after';
        return $mode === 'before' ? $this->status_before : $this->status_after;
    }

    /**
     * Get status for specific side
     */
    public function getStatusForSide(string $side): string
    {
        if (!in_array($side, ['before', 'after'])) {
            throw new \InvalidArgumentException('Invalid side. Must be "before" or "after".');
        }
        
        return $side === 'before' ? $this->status_before : $this->status_after;
    }

    /**
     * Set status for specific side
     */
    public function setStatusForSide(string $side, string $status): void
    {
        if (!in_array($side, ['before', 'after'])) {
            throw new \InvalidArgumentException('Invalid side. Must be "before" or "after".');
        }
        
        if (!in_array($status, ['draft', 'pending', 'approved', 'rejected'])) {
            throw new \InvalidArgumentException('Invalid status.');
        }

        $column = $side === 'before' ? 'status_before' : 'status_after';
        $this->forceFill([$column => $status]);
        
        // Update overall status based on both sides
        $this->status = $this->deriveOverallStatus();
    }

    /**
     * Derive overall status from both sides
     */
    protected function deriveOverallStatus(): string
    {
        // If both sides are approved, overall is approved
        if ($this->status_before === 'approved' && $this->status_after === 'approved') {
            return 'approved';
        }
        
        // If any side is pending, overall is pending
        if ($this->status_before === 'pending' || $this->status_after === 'pending') {
            return 'pending';
        }
        
        // If any side is rejected, overall is rejected
        if ($this->status_before === 'rejected' || $this->status_after === 'rejected') {
            return 'rejected';
        }
        
        // Default to the status of the current active side
        $activeSide = $this->deposit_display_order === 'before' ? 'before' : 'after';
        return $this->getStatusForSide($activeSide);
    }

    /**
     * Check if can submit for specific side
     */
    public function canSubmitForSide(string $side): bool
    {
        $status = $this->getStatusForSide($side);
        return $status === 'draft';
    }

    /**
     * Check if can approve for specific side
     */
    public function canApproveForSide(string $side): bool
    {
        $status = $this->getStatusForSide($side);
        return in_array($status, ['draft', 'pending']);
    }

    /**
     * Check if can reject for specific side
     */
    public function canRejectForSide(string $side): bool
    {
        $status = $this->getStatusForSide($side);
        return in_array($status, ['pending']);
    }

    // =======================================================================
    // |  Document Number Helpers (Dynamic Prefix Generation)
    // =======================================================================

    /**
     * Get prefix for document type and mode
     * 
     * @param string $type 'invoice' | 'tax_invoice' | 'receipt'
     * @param string $mode 'before' | 'after' | 'full'
     * @return string Prefix like 'INVB', 'TAXA', 'RECF', etc.
     */
    protected function getDocumentPrefix(string $type, string $mode): string
    {
        $prefixMap = [
            'invoice' => [
                'before' => 'INVB',
                'after'  => 'INVA',
                'full'   => 'INVA', // Full mode uses INVA
            ],
            'tax_invoice' => [
                'before' => 'TAXB',
                'after'  => 'TAXA',
                'full'   => 'TAXF',
            ],
            'receipt' => [
                'before' => 'RECB',
                'after'  => 'RECA',
                'full'   => 'RECF',
            ],
        ];
        
        return $prefixMap[$type][$mode] ?? 'INV';
    }

    /**
     * Get document number for specific type and mode
     * Converts existing number with appropriate prefix dynamically
     * 
     * @param string $type 'invoice' | 'tax_invoice' | 'receipt'
     * @param string|null $mode 'before' | 'after' | 'full' (null = use deposit_display_order)
     * @return string Document number with appropriate prefix (e.g., 'TAXB202510-0001')
     */
    public function getDocumentNumber(string $type, ?string $mode = null): string
    {
        // Determine mode from deposit_display_order if not specified
        $mode = $mode ?? $this->deposit_display_order ?? 'before';
        
        // Get the base number based on mode
        $baseNumber = ($mode === 'after' || $mode === 'full') 
            ? ($this->number_after ?? $this->number)
            : ($this->number_before ?? $this->number);
        
        // Return DRAFT if no number exists
        if (empty($baseNumber) || str_starts_with($baseNumber, 'DRAFT')) {
            return 'DRAFT';
        }
        
        // Extract numeric part (e.g., '202510-0001' from 'INVB202510-0001')
        $numericPart = preg_replace('/^[A-Z]+/', '', $baseNumber);
        
        // Get appropriate prefix for this document type and mode
        $prefix = $this->getDocumentPrefix($type, $mode);
        
        return $prefix . $numericPart;
    }

    /**
     * Get reference number based on mode
     * 
     * @param string|null $mode 'before' | 'after' | 'full' (null = use deposit_display_order)
     * @return string|null Reference document number
     */
    public function getReferenceNumber(?string $mode = null): ?string
    {
        $mode = $mode ?? $this->deposit_display_order ?? 'before';
        
        if ($mode === 'before') {
            // Reference for 'before' mode is the quotation number
            return $this->quotation?->number;
        } 
        elseif ($mode === 'after') {
            // Reference for 'after' mode is the INVB number (number_before)
            $refNumber = $this->number_before;
            
            // If number_before doesn't exist, check reference_invoice_number or referenceInvoice
            if (empty($refNumber)) {
                $refNumber = $this->reference_invoice_number;
            }
            if (empty($refNumber) && $this->referenceInvoice) {
                $refNumber = $this->referenceInvoice->number_before ?? $this->referenceInvoice->number;
            }
            
            // Don't return DRAFT numbers as references
            if ($refNumber && str_starts_with($refNumber, 'DRAFT')) {
                return null;
            }
            
            return $refNumber;
        } 
        elseif ($mode === 'full') {
            // Reference for 'full' (100%) mode is the quotation number
            return $this->quotation?->number;
        }
        
        return null;
    }

    /**
     * Get display number based on current deposit_display_order
     * This is the main invoice number shown in the header
     * 
     * @return string
     */
    public function getDisplayNumber(): string
    {
        $mode = $this->deposit_display_order ?? 'before';
        return $this->getDocumentNumber('invoice', $mode);
    }
}
