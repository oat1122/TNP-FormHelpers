<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use App\Models\PricingRequest;
use App\Models\User;

/**
 * QuotationPricingRequest Model
 * Junction table สำหรับ Many-to-Many relationship ระหว่าง Quotations และ Pricing Requests
 * 
 * @property string $id
 * @property string $quotation_id
 * @property string $pricing_request_id
 * @property int $sequence_order
 * @property float|null $allocated_amount
 * @property int|null $allocated_quantity
 * @property string|null $created_by
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class QuotationPricingRequest extends Model
{
    protected $table = 'quotation_pricing_requests';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'quotation_id',
        'pricing_request_id',
        'sequence_order',
        'allocated_amount',
        'allocated_quantity',
        'created_by'
    ];

    protected $casts = [
        'allocated_amount' => 'decimal:2',
        'allocated_quantity' => 'integer',
        'sequence_order' => 'integer',
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
     * Relationship: Belongs to Quotation
     * @return BelongsTo<Quotation, QuotationPricingRequest>
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'id');
    }

    /**
     * Relationship: Belongs to Pricing Request
     * @return BelongsTo<PricingRequest, QuotationPricingRequest>
     */
    public function pricingRequest(): BelongsTo
    {
        return $this->belongsTo(PricingRequest::class, 'pricing_request_id', 'pr_id');
    }

    /**
     * Relationship: Belongs to User (Created By)
     * @return BelongsTo<User, QuotationPricingRequest>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_uuid');
    }

    /**
     * Scope: Filter by quotation
     * @param Builder<QuotationPricingRequest> $query
     * @return Builder<QuotationPricingRequest>
     */
    public function scopeByQuotation(Builder $query, string $quotationId): Builder
    {
        return $query->where('quotation_id', $quotationId);
    }

    /**
     * Scope: Filter by pricing request
     * @param Builder<QuotationPricingRequest> $query
     * @return Builder<QuotationPricingRequest>
     */
    public function scopeByPricingRequest(Builder $query, string $pricingRequestId): Builder
    {
        return $query->where('pricing_request_id', $pricingRequestId);
    }

    /**
     * Scope: Order by sequence
     * @param Builder<QuotationPricingRequest> $query
     * @return Builder<QuotationPricingRequest>
     */
    public function scopeOrderBySequence(Builder $query): Builder
    {
        return $query->orderBy('sequence_order');
    }
}
