<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\MasterCustomer;
use App\Models\PricingRequest;
use App\Models\User;
use App\Models\Accounting\QuotationItem;
use App\Models\Company;

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
        'company_id',
        'number',
        'customer_id',
        'primary_pricing_request_id',
        'primary_pricing_request_ids',
        'customer_snapshot',
        'work_name',
        'status',
        'subtotal',
        'tax_amount',
        'special_discount_percentage',
        'special_discount_amount',
        'has_withholding_tax',
        'withholding_tax_percentage',
        'withholding_tax_amount',
        'final_total_amount',
        'total_amount',
        'deposit_percentage',
        'deposit_amount',
        'deposit_mode',
        'payment_terms',
        'due_date',
        'notes',
        'document_header_type',
        'signature_images',
        'sample_images',
        'created_by',
        'updated_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
    'primary_pricing_request_ids' => 'array',
    'customer_snapshot' => 'array',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'special_discount_percentage' => 'decimal:2',
        'special_discount_amount' => 'decimal:2',
        'has_withholding_tax' => 'boolean',
        'withholding_tax_percentage' => 'decimal:2',
        'withholding_tax_amount' => 'decimal:2',
        'final_total_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'deposit_percentage' => 'integer',
        'deposit_mode' => 'string',
        'signature_images' => 'array',
        'sample_images' => 'array',
        'due_date' => 'date',
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Append calculated accessors to JSON output
     */
    protected $appends = [
        'calculated_withholding_tax',
        'net_after_discount', 
        'final_net_amount'
    ];

    // Generate UUID when creating
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
            // Assign a default company_id if not provided (first active company)
            if (empty($model->company_id)) {
                $model->company_id = optional(\App\Models\Company::where('is_active', true)->first())->id;
            }
        });
    }

    /**
     * Relationship: Quotation belongs to Company
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id', 'id');
    }

    /**
     * Relationship: Quotation belongs to PricingRequest
     */
    public function pricingRequest(): BelongsTo
    {
        // Backward-compatible accessor to primary PR
        return $this->belongsTo(PricingRequest::class, 'primary_pricing_request_id', 'pr_id');
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
     * Relationship: Quotation has many Quotation Items
     */
    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class, 'quotation_id', 'id')
                    ->orderBy('sequence_order');
    }

    /**
     * Relationship: Quotation has many Pricing Requests (via junction table)
     */
    public function quotationPricingRequests(): HasMany
    {
        return $this->hasMany(QuotationPricingRequest::class, 'quotation_id', 'id')
                    ->orderBy('sequence_order');
    }

    /**
     * Relationship: Many-to-Many with Pricing Requests through junction table
     */
    public function pricingRequests()
    {
        return $this->belongsToMany(
            \App\Models\PricingRequest::class,
            'quotation_pricing_requests',
            'quotation_id',
            'pricing_request_id',
            'id',
            'pr_id'
        )->withPivot(['sequence_order', 'allocated_amount', 'allocated_quantity', 'created_by'])
         ->withTimestamps()
         ->orderBy('sequence_order');
    }

    /**
     * Relationship: Primary Pricing Request (first in the list)
     */
    public function primaryPricingRequest(): BelongsTo
    {
        return $this->belongsTo(\App\Models\PricingRequest::class, 'primary_pricing_request_id', 'pr_id');
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
    public static function generateQuotationNumber(string $companyId)
    {
        return app(\App\Services\Support\DocumentNumberService::class)
            ->next($companyId, 'quotation');
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
     * Calculate net amount after special discount (before withholding tax)
     */
    public function getNetAfterDiscountAttribute()
    {
        return $this->total_amount - $this->special_discount_amount;
    }

    /**
     * Calculate withholding tax amount based on subtotal (before VAT)
     * ภาษีหัก ณ ที่จ่าย = ยอดก่อนภาษี × อัตราภาษี
     */
    public function getCalculatedWithholdingTaxAttribute()
    {
        if (!$this->has_withholding_tax || $this->withholding_tax_percentage <= 0) {
            return 0;
        }
        return $this->subtotal * ($this->withholding_tax_percentage / 100);
    }

    /**
     * Calculate final total after all deductions
     * ยอดสุทธิสุดท้าย = ยอดหลังหักส่วนลดพิเศษ - ภาษีหัก ณ ที่จ่าย
     */
    public function getFinalNetAmountAttribute()
    {
        $netAfterDiscount = $this->net_after_discount;
        $withholdingTax = $this->calculated_withholding_tax;
        return $netAfterDiscount - $withholdingTax;
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

    /**
     * Get primary pricing request IDs as array
     * รองรับทั้ง primary_pricing_request_id (single) และ primary_pricing_request_ids (array)
     */
    public function getPrimaryPricingRequestIdsAttribute()
    {
        // ถ้ามี primary_pricing_request_ids ใช้ array นั้น
        if (!empty($this->attributes['primary_pricing_request_ids'])) {
            $decoded = json_decode($this->attributes['primary_pricing_request_ids'], true);
            return is_array($decoded) ? $decoded : [$decoded];
        }
        
        // fallback ไปใช้ primary_pricing_request_id (single value)
        if (!empty($this->attributes['primary_pricing_request_id'])) {
            return [$this->attributes['primary_pricing_request_id']];
        }
        
        return [];
    }

    /**
     * Set primary pricing request IDs from array
     */
    public function setPrimaryPricingRequestIdsAttribute($value)
    {
        if (is_array($value)) {
            $this->attributes['primary_pricing_request_ids'] = json_encode($value);
            // ตั้ง primary_pricing_request_id เป็น first element สำหรับ backward compatibility
            $this->attributes['primary_pricing_request_id'] = !empty($value) ? $value[0] : null;
        } elseif (is_string($value)) {
            $this->attributes['primary_pricing_request_ids'] = json_encode([$value]);
            $this->attributes['primary_pricing_request_id'] = $value;
        } else {
            $this->attributes['primary_pricing_request_ids'] = null;
            $this->attributes['primary_pricing_request_id'] = null;
        }
    }

    /**
     * Helper: ดึง Pricing Requests ทั้งหมดที่เชื่อมโยงกับ Quotation นี้
     */
    public function getAllPricingRequests()
    {
        return \App\Models\PricingRequest::whereIn('pr_id', $this->getPrimaryPricingRequestIdsAttribute())->get();
    }

    /**
     * Helper: ตรวจสอบว่า Quotation นี้มี Pricing Request ID ที่ระบุหรือไม่
     */
    public function hasPricingRequest($pricingRequestId)
    {
        return in_array($pricingRequestId, $this->getPrimaryPricingRequestIdsAttribute());
    }
}
