<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\MasterCustomer;
use App\Models\PricingRequest;
use App\Models\User;

/**
 * Class Quotation
 * 
 * @property string $id
 * @property string $number
 * @property string|null $pricing_request_id
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
 * @property string|null $silk_screen
 * @property string|null $dft_screen
 * @property string|null $embroider
 * @property string|null $sub_screen
 * @property string|null $other_screen
 * @property string|null $product_image
 * @property string $status
 * @property float $subtotal
 * @property float $tax_amount
 * @property float $total_amount
 * @property int $deposit_percentage
 * @property float $deposit_amount
 * @property string|null $payment_terms
 * @property \Carbon\Carbon|null $due_date
 * @property string|null $notes
 * @property string|null $created_by
 * @property string|null $approved_by
 * @property \Carbon\Carbon|null $approved_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Quotation extends Model
{
    protected $table = 'quotations';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'number',
        'pricing_request_id',
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
        'silk_screen',
        'dft_screen',
        'embroider',
        'sub_screen',
        'other_screen',
        'product_image',
        'status',
        'subtotal',
        'tax_amount',
        'total_amount',
        'deposit_percentage',
        'deposit_amount',
        'payment_terms',
        'due_date',
        'notes',
        'created_by',
        'approved_by',
        'approved_at'
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'deposit_percentage' => 'integer',
        'due_date' => 'date',
        'approved_at' => 'datetime',
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
     * Relationship: Quotation belongs to PricingRequest
     */
    public function pricingRequest(): BelongsTo
    {
        return $this->belongsTo(PricingRequest::class, 'pricing_request_id', 'pr_id');
    }

    /**
     * Relationship: Quotation belongs to Customer
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(MasterCustomer::class, 'customer_id', 'cus_id');
    }

    /**
     * Relationship: Quotation belongs to Creator
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_uuid');
    }

    /**
     * Relationship: Quotation belongs to Approver
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_uuid');
    }

    /**
     * Relationship: Quotation has many Invoices
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'quotation_id', 'id');
    }

    /**
     * Relationship: Quotation has many Order Items Tracking
     */
    public function orderItemsTracking(): HasMany
    {
        return $this->hasMany(OrderItemsTracking::class, 'quotation_id', 'id');
    }

    /**
     * Relationship: Quotation has many Document History
     */
    public function documentHistory(): HasMany
    {
        return $this->hasMany(DocumentHistory::class, 'document_id', 'id')
                    ->where('document_type', 'quotation');
    }

    /**
     * Relationship: Quotation has many Document Attachments
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(DocumentAttachment::class, 'document_id', 'id')
                    ->where('document_type', 'quotation');
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
     * Scope: Filter by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Auto-generate quotation number
     */
    public static function generateQuotationNumber()
    {
        $year = date('Y');
        $month = date('m');
        $prefix = 'QT' . $year . $month;
        
        $lastQuotation = static::where('number', 'like', $prefix . '%')
                              ->orderBy('number', 'desc')
                              ->first();
        
        if ($lastQuotation) {
            $lastNumber = intval(substr($lastQuotation->number, -4));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . '-' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
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
        return $this->total_amount - $this->deposit_amount;
    }

    /**
     * Check if quotation is approved
     */
    public function isApproved()
    {
        return $this->status === 'approved';
    }

    /**
     * Check if quotation can be converted to invoice
     */
    public function canConvertToInvoice()
    {
        return in_array($this->status, ['approved', 'sent']);
    }
}
