<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\User;
use App\Models\PricingRequest;

class InvoiceItem extends Model
{
    use HasUuids;

    protected $table = 'invoice_items';
    
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'invoice_id',
        'quotation_item_id',
        'pricing_request_id',
        'item_name',
        'item_description',
        'sequence_order',
        'pattern',
        'fabric_type',
        'color',
        'size',
        'unit_price',
        'quantity',
        'unit',
        'discount_percentage',
        'discount_amount',
        'item_images',
        'notes',
        'status',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'item_images' => 'array'
    ];

    /**
     * ใบแจ้งหนี้ที่สังกัด
     * @return BelongsTo<Invoice, InvoiceItem>
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    /**
     * รายการจากใบเสนอราคา (ถ้ามี)
     * @return BelongsTo<QuotationItem, InvoiceItem>
     */
    public function quotationItem(): BelongsTo
    {
        return $this->belongsTo(QuotationItem::class, 'quotation_item_id');
    }

    /**
     * Pricing Request ที่อ้างอิง
     * @return BelongsTo<PricingRequest, InvoiceItem>
     */
    public function pricingRequest(): BelongsTo
    {
        return $this->belongsTo(PricingRequest::class, 'pricing_request_id', 'pr_id');
    }

    /**
     * ผู้สร้าง
     * @return BelongsTo<User, InvoiceItem>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_uuid');
    }

    /**
     * ผู้แก้ไขล่าสุด
     * @return BelongsTo<User, InvoiceItem>
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by', 'user_uuid');
    }

    /**
     * คำนวณ subtotal (ราคารวม)
     * Note: ในฐานข้อมูลเป็น virtual column แต่เราสามารถคำนวณใน PHP ได้ด้วย
     */
    public function getSubtotalAttribute(): float
    {
        return $this->unit_price * $this->quantity;
    }

    /**
     * คำนวณ final_amount (ราคาสุทธิหลังหักส่วนลด)
     * Note: ในฐานข้อมูลเป็น virtual column แต่เราสามารถคำนวณใน PHP ได้ด้วย
     */
    public function getFinalAmountAttribute(): float
    {
        return $this->getSubtotalAttribute() - $this->discount_amount;
    }
}
