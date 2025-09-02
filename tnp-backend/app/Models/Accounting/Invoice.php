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
        'fabric_type',
        'pattern',
        'color',
        'sizes',
        'quantity',
        'status',
        'type',
        'subtotal',
        'tax_amount',
        'total_amount',
        'paid_amount',
        'due_date',
        'payment_method',
        'payment_terms',
        'notes',
        'document_header_type',
        'created_by',
        'submitted_by',
        'approved_by',
        'rejected_by',
        'sent_by',
        'submitted_at',
        'approved_at',
        'rejected_at',
        'sent_at',
        'paid_at'
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
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
     * Relationship: Invoice belongs to Customer
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(MasterCustomer::class, 'customer_id', 'cus_id');
    }

    /**
     * Relationship: Invoice belongs to Creator
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_uuid');
    }

    /**
     * Relationship: Invoice belongs to Approver
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_uuid');
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
        return $this->total_amount - $this->paid_amount;
    }

    /**
     * Check if invoice is fully paid
     */
    public function isFullyPaid()
    {
        return $this->paid_amount >= $this->total_amount;
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
}
