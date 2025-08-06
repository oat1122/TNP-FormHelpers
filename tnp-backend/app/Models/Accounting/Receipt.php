<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\MasterCustomer;
use App\Models\User;

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
 */
class Receipt extends Model
{
    protected $table = 'receipts';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
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
        'approved_at'
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
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
     * Relationship: Receipt belongs to Invoice
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id', 'id');
    }

    /**
     * Relationship: Receipt belongs to Customer
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(MasterCustomer::class, 'customer_id', 'cus_id');
    }

    /**
     * Relationship: Receipt belongs to Issuer
     */
    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by', 'user_uuid');
    }

    /**
     * Relationship: Receipt belongs to Approver
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_uuid');
    }

    /**
     * Relationship: Receipt has many Delivery Notes
     */
    public function deliveryNotes(): HasMany
    {
        return $this->hasMany(DeliveryNote::class, 'receipt_id', 'id');
    }

    /**
     * Relationship: Receipt has many Document History
     */
    public function documentHistory(): HasMany
    {
        return $this->hasMany(DocumentHistory::class, 'document_id', 'id')
                    ->where('document_type', 'receipt');
    }

    /**
     * Relationship: Receipt has many Document Attachments
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(DocumentAttachment::class, 'document_id', 'id')
                    ->where('document_type', 'receipt');
    }

    /**
     * Scope: Filter by type
     */
    public function scopeType($query, $type)
    {
        return $query->where('type', $type);
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
     * Auto-generate receipt number based on type
     */
    public static function generateReceiptNumber($type = 'receipt')
    {
        $year = date('Y');
        $month = date('m');
        
        $prefixMap = [
            'receipt' => 'RCPT',
            'tax_invoice' => 'TAX',
            'full_tax_invoice' => 'FTAX'
        ];
        
        $prefix = $prefixMap[$type] . $year . $month;
        
        $lastReceipt = static::where('number', 'like', $prefix . '%')
                            ->where('type', $type)
                            ->orderBy('number', 'desc')
                            ->first();
        
        if ($lastReceipt) {
            $lastNumber = intval(substr($lastReceipt->number, -4));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . '-' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Auto-generate tax invoice number
     */
    public function generateTaxInvoiceNumber()
    {
        if ($this->type === 'tax_invoice' || $this->type === 'full_tax_invoice') {
            $year = date('Y');
            $month = date('m');
            $prefix = 'TI' . $year . $month;
            
            $lastTaxInvoice = static::where('tax_invoice_number', 'like', $prefix . '%')
                                  ->orderBy('tax_invoice_number', 'desc')
                                  ->first();
            
            if ($lastTaxInvoice) {
                $lastNumber = intval(substr($lastTaxInvoice->tax_invoice_number, -4));
                $newNumber = $lastNumber + 1;
            } else {
                $newNumber = 1;
            }
            
            $this->tax_invoice_number = $prefix . '-' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
            $this->save();
        }
        
        return $this;
    }

    /**
     * Get customer full name
     */
    public function getCustomerFullNameAttribute()
    {
        return trim($this->customer_firstname . ' ' . $this->customer_lastname);
    }

    /**
     * Check if receipt is approved
     */
    public function isApproved()
    {
        return $this->status === 'approved';
    }

    /**
     * Check if receipt can be converted to delivery note
     */
    public function canConvertToDeliveryNote()
    {
        return in_array($this->status, ['approved', 'sent']);
    }

    /**
     * Get type label in Thai
     */
    public function getTypeLabelAttribute()
    {
        $labels = [
            'receipt' => 'ใบเสร็จรับเงิน',
            'tax_invoice' => 'ใบกำกับภาษี',
            'full_tax_invoice' => 'ใบเสร็จรับเงิน/ใบกำกับภาษี'
        ];
        
        return $labels[$this->type] ?? $this->type;
    }
}
