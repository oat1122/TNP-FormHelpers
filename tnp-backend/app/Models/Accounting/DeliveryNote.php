<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\MasterCustomer;
use App\Models\User;

/**
 * Class DeliveryNote
 * 
 * @property string $id
 * @property string $number
 * @property string|null $receipt_id
 * @property string|null $customer_id
 * @property string|null $customer_company
 * @property string|null $customer_address
 * @property string|null $customer_zip_code
 * @property string|null $customer_tel_1
 * @property string|null $customer_firstname
 * @property string|null $customer_lastname
 * @property string|null $work_name
 * @property string|null $quantity
 * @property string $status
 * @property string $delivery_method
 * @property string|null $courier_company
 * @property string|null $tracking_number
 * @property string|null $delivery_address
 * @property string|null $recipient_name
 * @property string|null $recipient_phone
 * @property \Carbon\Carbon|null $delivery_date
 * @property \Carbon\Carbon|null $delivered_at
 * @property string|null $delivery_notes
 * @property string|null $notes
 * @property string|null $created_by
 * @property string|null $delivered_by
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class DeliveryNote extends Model
{
    protected $table = 'delivery_notes';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'number',
        'receipt_id',
        'customer_id',
        'customer_company',
        'customer_address',
        'customer_zip_code',
        'customer_tel_1',
        'customer_firstname',
        'customer_lastname',
        'work_name',
        'quantity',
        'status',
        'delivery_method',
        'courier_company',
        'tracking_number',
        'delivery_address',
        'recipient_name',
        'recipient_phone',
        'delivery_date',
        'delivered_at',
        'delivery_notes',
        'notes',
        'created_by',
        'delivered_by'
    ];

    protected $casts = [
        'delivery_date' => 'date',
        'delivered_at' => 'datetime',
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
     * Relationship: DeliveryNote belongs to Receipt
     */
    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class, 'receipt_id', 'id');
    }

    /**
     * Relationship: DeliveryNote belongs to Customer
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(MasterCustomer::class, 'customer_id', 'cus_id');
    }

    /**
     * Relationship: DeliveryNote belongs to Creator
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_uuid');
    }

    /**
     * Relationship: DeliveryNote belongs to Delivery Person
     */
    public function deliveryPerson(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delivered_by', 'user_uuid');
    }

    /**
     * Relationship: DeliveryNote has many Document History
     */
    public function documentHistory(): HasMany
    {
        return $this->hasMany(DocumentHistory::class, 'document_id', 'id')
                    ->where('document_type', 'delivery_note');
    }

    /**
     * Relationship: DeliveryNote has many Document Attachments
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(DocumentAttachment::class, 'document_id', 'id')
                    ->where('document_type', 'delivery_note');
    }

    /**
     * Scope: Filter by status
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Filter by delivery method
     */
    public function scopeDeliveryMethod($query, $method)
    {
        return $query->where('delivery_method', $method);
    }

    /**
     * Scope: Filter by customer
     */
    public function scopeCustomer($query, $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    /**
     * Scope: Filter by delivery date
     */
    public function scopeDeliveryDate($query, $date)
    {
        return $query->whereDate('delivery_date', $date);
    }

    /**
     * Auto-generate delivery note number
     */
    public static function generateDeliveryNoteNumber()
    {
        $year = date('Y');
        $month = date('m');
        $prefix = 'DN' . $year . $month;
        
        $lastDeliveryNote = static::where('number', 'like', $prefix . '%')
                                 ->orderBy('number', 'desc')
                                 ->first();
        
        if ($lastDeliveryNote) {
            $lastNumber = intval(substr($lastDeliveryNote->number, -4));
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
     * Check if delivery is completed
     */
    public function isDelivered()
    {
        return in_array($this->status, ['delivered', 'completed']);
    }

    /**
     * Mark as delivered
     */
    public function markAsDelivered($deliveredBy = null, $notes = null)
    {
        $this->status = 'delivered';
        $this->delivered_at = now();
        
        if ($deliveredBy) {
            $this->delivered_by = $deliveredBy;
        }
        
        if ($notes) {
            $this->delivery_notes = $notes;
        }
        
        $this->save();
        
        return $this;
    }

    /**
     * Get status label in Thai
     */
    public function getStatusLabelAttribute()
    {
        $labels = [
            'preparing' => 'กำลังเตรียม',
            'shipping' => 'กำลังจัดส่ง',
            'in_transit' => 'อยู่ระหว่างขนส่ง',
            'delivered' => 'ส่งแล้ว',
            'completed' => 'เสร็จสิ้น',
            'failed' => 'ไม่สำเร็จ'
        ];
        
        return $labels[$this->status] ?? $this->status;
    }

    /**
     * Get delivery method label in Thai
     */
    public function getDeliveryMethodLabelAttribute()
    {
        $labels = [
            'self_delivery' => 'ส่งเอง',
            'courier' => 'บริษัทขนส่ง',
            'customer_pickup' => 'ลูกค้ามารับเอง'
        ];
        
        return $labels[$this->delivery_method] ?? $this->delivery_method;
    }

    /**
     * Generate tracking URL (if using external courier)
     */
    public function getTrackingUrlAttribute()
    {
        if (!$this->tracking_number || $this->delivery_method !== 'courier') {
            return null;
        }

        // Add tracking URLs for popular courier services in Thailand
        $trackingUrls = [
            'Kerry Express' => 'https://th.kerryexpress.com/en/track/?track=' . $this->tracking_number,
            'Thailand Post' => 'https://track.thailandpost.co.th/?trackNumber=' . $this->tracking_number,
            'Flash Express' => 'https://www.flashexpress.co.th/tracking/?se=' . $this->tracking_number,
            'J&T Express' => 'https://www.jtexpress.co.th/index/query/gzquery.html?bills=' . $this->tracking_number,
        ];

        return $trackingUrls[$this->courier_company] ?? null;
    }
}
