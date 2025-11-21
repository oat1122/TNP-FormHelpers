<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

/**
 * QuotationInvoiceSyncJob Model
 * 
 * Tracks background sync operations from quotations to invoices
 * 
 * @property string $id
 * @property string $quotation_id
 * @property array $affected_invoice_ids
 * @property array|null $original_quotation_snapshot
 * @property array|null $original_invoices_snapshot
 * @property string $status
 * @property int $progress_current
 * @property int $progress_total
 * @property string|null $error_message
 * @property string|null $started_by
 * @property \Carbon\Carbon|null $started_at
 * @property \Carbon\Carbon|null $completed_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class QuotationInvoiceSyncJob extends Model
{
    protected $table = 'quotation_invoice_sync_jobs';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'quotation_id',
        'affected_invoice_ids',
        'original_quotation_snapshot',
        'original_invoices_snapshot',
        'status',
        'progress_current',
        'progress_total',
        'error_message',
        'started_by',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'affected_invoice_ids' => 'array',
        'original_quotation_snapshot' => 'array',
        'original_invoices_snapshot' => 'array',
        'progress_current' => 'integer',
        'progress_total' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Generate UUID when creating
     */
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
     * Relationship: Sync job belongs to Quotation
     * 
     * @return BelongsTo<Quotation, QuotationInvoiceSyncJob>
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'id');
    }

    /**
     * Relationship: Sync job belongs to User (starter)
     * 
     * @return BelongsTo<User, QuotationInvoiceSyncJob>
     */
    public function startedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'started_by', 'user_uuid');
    }

    /**
     * Check if sync job is currently processing
     * 
     * @return bool
     */
    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }

    /**
     * Check if sync job is completed
     * 
     * @return bool
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if sync job has failed
     * 
     * @return bool
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Check if sync job is pending
     * 
     * @return bool
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Get progress percentage (0-100)
     * 
     * @return float
     */
    public function getProgressPercentage(): float
    {
        if ($this->progress_total === 0) {
            return 0;
        }

        return round(($this->progress_current / $this->progress_total) * 100, 2);
    }

    /**
     * Get affected invoice numbers by joining with invoices table
     * 
     * @return array<string>
     */
    public function getAffectedInvoiceNumbers(): array
    {
        if (empty($this->affected_invoice_ids)) {
            return [];
        }

        return Invoice::whereIn('id', $this->affected_invoice_ids)
            ->pluck('number')
            ->toArray();
    }

    /**
     * Check if job can be retried
     * 
     * @return bool
     */
    public function canRetry(): bool
    {
        return $this->isFailed();
    }

    /**
     * Get elapsed time in seconds
     * 
     * @return int|null
     */
    public function getElapsedSeconds(): ?int
    {
        if (!$this->started_at) {
            return null;
        }

        $endTime = $this->completed_at ?? now();
        return $this->started_at->diffInSeconds($endTime);
    }

    /**
     * Scope: Filter by status
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $status
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Filter by quotation
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $quotationId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForQuotation($query, string $quotationId)
    {
        return $query->where('quotation_id', $quotationId);
    }

    /**
     * Scope: Get recent jobs first
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeRecent($query)
    {
        return $query->orderBy('created_at', 'desc');
    }
}
