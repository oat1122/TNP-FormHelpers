<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\MasterCustomer;
use App\Models\User;

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
        'quotation_id',
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
        'type',
        'subtotal',
        'tax_amount',
        'total_amount',
        'special_discount_percentage',
        'special_discount_amount',
        'has_vat',
        'vat_percentage',
        'vat_amount',
        'has_withholding_tax',
        'withholding_tax_percentage',
        'withholding_tax_amount',
        'final_total_amount',
        'deposit_percentage',
        'deposit_amount',
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

    protected $casts = [
        'primary_pricing_request_ids' => 'array',
        'customer_snapshot' => 'array',
        'signature_images' => 'array',
        'sample_images' => 'array',
    'evidence_files' => 'array',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'special_discount_percentage' => 'decimal:2',
        'special_discount_amount' => 'decimal:2',
        'vat_percentage' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'withholding_tax_percentage' => 'decimal:2',
        'withholding_tax_amount' => 'decimal:2',
        'final_total_amount' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
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
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
            if (empty($model->company_id)) {
                $model->company_id = optional(\App\Models\Company::where('is_active', true)->first())->id;
            }
            
            // Auto-set inv_manage_by from quotation's created_by if not set
            if (empty($model->inv_manage_by) && !empty($model->quotation_id)) {
                $quotation = \App\Models\Accounting\Quotation::find($model->quotation_id);
                if ($quotation && !empty($quotation->created_by)) {
                    $model->inv_manage_by = $quotation->created_by;
                }
            }
        });
        
        static::updating(function ($model) {
            // Auto-sync inv_manage_by if quotation_id changed and inv_manage_by is empty
            if ($model->isDirty('quotation_id') && empty($model->inv_manage_by) && !empty($model->quotation_id)) {
                $quotation = \App\Models\Accounting\Quotation::find($model->quotation_id);
                if ($quotation && !empty($quotation->created_by)) {
                    $model->inv_manage_by = $quotation->created_by;
                }
            }
        });
    }

    /**
     * Relationship: Invoice belongs to Quotation
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'id');
    }

    /**
     * Relationship: Invoice has many InvoiceItems
     */
    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class, 'invoice_id')
                   ->orderBy('sequence_order');
    }

    /**
     * Relationship: Invoice belongs to primary pricing request
     */
    public function primaryPricingRequest(): BelongsTo
    {
        return $this->belongsTo(\App\Models\PricingRequest::class, 'primary_pricing_request_id', 'pr_id');
    }

    /**
     * Relationship: Invoice belongs to Customer
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(MasterCustomer::class, 'customer_id', 'cus_id');
    }

    /**
     * Relationship: Invoice belongs to Company
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Company::class, 'company_id', 'id');
    }

    /**
     * Relationship: Invoice belongs to Creator
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to Updater
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to Manager
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inv_manage_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to Submitter
     */
    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to Approver
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to Rejecter
     */
    public function rejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to Sender
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice has many Receipts
     */
    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class, 'invoice_id', 'id');
    }

    /**
     * Relationship: Invoice has many Document History
     */
    public function documentHistory(): HasMany
    {
        return $this->hasMany(DocumentHistory::class, 'document_id', 'id')
                    ->where('document_type', 'invoice');
    }

    /**
     * Relationship: Invoice has many Document Attachments
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(DocumentAttachment::class, 'document_id', 'id')
                    ->where('document_type', 'invoice');
    }

    /**
     * Scope: Filter by status
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Filter by customer
     */
    public function scopeCustomer($query, $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    /**
     * Scope: Overdue invoices
     */
    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
                    ->whereNotIn('status', ['fully_paid']);
    }

    /**
     * Auto-generate invoice number
     */
    public static function generateInvoiceNumber(string $companyId)
    {
        return app(\App\Services\Support\DocumentNumberService::class)
            ->next($companyId, 'invoice');
    }

    /**
     * Get customer full name
     */
    public function getCustomerFullNameAttribute()
    {
        return trim($this->customer_firstname . ' ' . $this->customer_lastname);
    }

    /**
     * Calculate remaining amount after paid
     */
    public function getRemainingAmountAttribute()
    {
        return $this->final_total_amount - $this->paid_amount;
    }

    /**
     * Check if invoice is fully paid
     */
    public function isFullyPaid()
    {
        return $this->paid_amount >= $this->final_total_amount;
    }

    /**
     * Check if invoice is overdue
     */
    public function isOverdue()
    {
        return $this->due_date && $this->due_date < now() && !$this->isFullyPaid();
    }

    /**
     * Record payment
     */
    public function recordPayment($amount, $method = null, $reference = null)
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
    public function canConvertToReceipt()
    {
        return in_array($this->status, ['approved', 'sent', 'partial_paid', 'fully_paid']);
    }

    /**
     * Sync inv_manage_by from related quotation's created_by
     */
    public function syncManagerFromQuotation()
    {
        if ($this->quotation_id && $this->quotation) {
            $this->inv_manage_by = $this->quotation->created_by;
            $this->save();
            return true;
        }
        return false;
    }
}
