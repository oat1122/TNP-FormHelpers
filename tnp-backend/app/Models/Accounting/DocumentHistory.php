<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

/**
 * Class DocumentHistory
 * 
 * @property string $id
 * @property string $document_type
 * @property string $document_id
 * @property string|null $previous_status
 * @property string|null $new_status
 * @property string|null $action
 * @property string|null $notes
 * @property string|null $action_by
 * @property \Carbon\Carbon $created_at
 */
class DocumentHistory extends Model
{
    protected $table = 'document_history';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false; // Only using created_at

    protected $fillable = [
        'id',
        'document_type',
        'document_id',
        'previous_status',
        'new_status',
        'action',
        'notes',
        'action_by'
    ];

    protected $casts = [
        'created_at' => 'datetime'
    ];

    // Generate UUID when creating
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
            
            if (empty($model->created_at)) {
                $model->created_at = now();
            }
        });
    }

    /**
     * Relationship: DocumentHistory belongs to User who performed action
     */
    public function actionBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'action_by', 'user_uuid');
    }

    /**
     * Get document polymorphic relationship
     */
    public function document()
    {
        switch ($this->document_type) {
            case 'quotation':
                return $this->belongsTo(Quotation::class, 'document_id', 'id');
            case 'invoice':
                return $this->belongsTo(Invoice::class, 'document_id', 'id');
            case 'receipt':
                return $this->belongsTo(Receipt::class, 'document_id', 'id');
            case 'delivery_note':
                return $this->belongsTo(DeliveryNote::class, 'document_id', 'id');
            default:
                return null;
        }
    }

    /**
     * Scope: Filter by document type
     */
    public function scopeDocumentType($query, $type)
    {
        return $query->where('document_type', $type);
    }

    /**
     * Scope: Filter by document ID
     */
    public function scopeDocument($query, $documentId)
    {
        return $query->where('document_id', $documentId);
    }

    /**
     * Scope: Filter by action performed by user
     */
    public function scopeActionBy($query, $userId)
    {
        return $query->where('action_by', $userId);
    }

    /**
     * Create history record for status change
     */
    public static function logStatusChange($documentType, $documentId, $previousStatus, $newStatus, $actionBy, $notes = null)
    {
        return static::safeCreate([
            'document_type' => $documentType,
            'document_id' => $documentId,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'action' => 'status_change',
            'notes' => $notes,
            'action_by' => $actionBy
        ]);
    }

    /**
     * Create history record for invoice revert action (consolidated version)
     */
    public static function logInvoiceRevert($documentId, $actionBy, $changes, $reason = null)
    {
        $changesText = is_array($changes) ? implode(', ', $changes) : $changes;
        $notesText = "ย้อนสถานะกลับเป็น draft: {$changesText}";
        
        if ($reason) {
            $notesText .= " (เหตุผล: {$reason})";
        }

        return static::safeCreate([
            'document_type' => 'invoice',
            'document_id' => $documentId,
            'previous_status' => null, // Multiple sides may have different previous statuses
            'new_status' => null,      // Multiple sides may have different new statuses
            'action' => 'revert_to_draft',
            'notes' => $notesText,
            'action_by' => $actionBy
        ]);
    }

    /**
     * Check if a similar history entry exists within the last few seconds
     * This helps prevent duplicate entries during rapid operations
     */
    public static function hasDuplicateEntry($documentType, $documentId, $action, $actionBy, $timeWindowSeconds = 5)
    {
        $cutoff = now()->subSeconds($timeWindowSeconds);
        
        return static::where('document_type', $documentType)
            ->where('document_id', $documentId)
            ->where('action', $action)
            ->where('action_by', $actionBy)
            ->where('created_at', '>=', $cutoff)
            ->exists();
    }

    /**
     * Safe create - prevents duplicate entries
     */
    public static function safeCreate(array $attributes)
    {
        // Check for potential duplicates for critical actions
        if (in_array($attributes['action'] ?? '', ['revert_to_draft', 'status_change'])) {
            $isDuplicate = static::hasDuplicateEntry(
                $attributes['document_type'],
                $attributes['document_id'],
                $attributes['action'],
                $attributes['action_by'] ?? null
            );
            
            if ($isDuplicate) {
                \Log::warning('DocumentHistory: Prevented duplicate entry', $attributes);
                return null; // Don't create duplicate
            }
        }

        return static::create($attributes);
    }

    /**
     * Create history record for document creation
     */
    public static function logCreation($documentType, $documentId, $actionBy, $notes = null)
    {
        return static::create([
            'document_type' => $documentType,
            'document_id' => $documentId,
            'previous_status' => null,
            'new_status' => 'draft',
            'action' => 'created',
            'notes' => $notes,
            'action_by' => $actionBy
        ]);
    }

    /**
     * Create history record for document approval
     */
    public static function logApproval($documentType, $documentId, $actionBy, $notes = null)
    {
        return static::create([
            'document_type' => $documentType,
            'document_id' => $documentId,
            'previous_status' => 'pending_review',
            'new_status' => 'approved',
            'action' => 'approved',
            'notes' => $notes,
            'action_by' => $actionBy
        ]);
    }

    /**
     * Create history record for document rejection
     */
    public static function logRejection($documentType, $documentId, $actionBy, $notes = null)
    {
        return static::create([
            'document_type' => $documentType,
            'document_id' => $documentId,
            'previous_status' => 'pending_review',
            'new_status' => 'rejected',
            'action' => 'rejected',
            'notes' => $notes,
            'action_by' => $actionBy
        ]);
    }

    /**
     * Create history record for custom action
     */
    public static function logAction($documentType, $documentId, $action, $actionBy, $notes = null)
    {
        // Use safe create for critical actions that might be duplicated
        $criticalActions = ['revert_to_draft', 'status_change', 'approved', 'rejected'];
        
        if (in_array($action, $criticalActions)) {
            return static::safeCreate([
                'document_type' => $documentType,
                'document_id' => $documentId,
                'action' => $action,
                'notes' => $notes,
                'action_by' => $actionBy
            ]);
        }

        return static::create([
            'document_type' => $documentType,
            'document_id' => $documentId,
            'action' => $action,
            'notes' => $notes,
            'action_by' => $actionBy
        ]);
    }

    /**
     * Get action label in Thai
     */
    public function getActionLabelAttribute()
    {
        $labels = [
            'created' => 'สร้างเอกสาร',
            'status_change' => 'เปลี่ยนสถานะ',
            'approved' => 'อนุมัติ',
            'rejected' => 'ปฏิเสธ',
            'sent' => 'ส่งเอกสาร',
            'converted' => 'แปลงเอกสาร',
            'updated' => 'แก้ไขข้อมูล',
            'deleted' => 'ลบเอกสาร'
        ];
        
        return $labels[$this->action] ?? $this->action;
    }

    /**
     * Get document type label in Thai
     */
    public function getDocumentTypeLabelAttribute()
    {
        $labels = [
            'quotation' => 'ใบเสนอราคา',
            'invoice' => 'ใบแจ้งหนี้',
            'receipt' => 'ใบเสร็จรับเงิน',
            'delivery_note' => 'ใบส่งของ',
            'credit_note' => 'ใบลดหนี้',
            'debit_note' => 'ใบเพิ่มหนี้'
        ];
        
        return $labels[$this->document_type] ?? $this->document_type;
    }

    /**
     * Clean up duplicate revert_to_draft entries for a document
     * This is a maintenance method to clean existing duplicates
     */
    public static function cleanupDuplicateReverts($documentType, $documentId)
    {
        $duplicates = static::where('document_type', $documentType)
            ->where('document_id', $documentId)
            ->where('action', 'revert_to_draft')
            ->orderBy('created_at')
            ->get()
            ->groupBy(function ($item) {
                return $item->created_at->format('Y-m-d H:i:s');
            })
            ->filter(function ($group) {
                return $group->count() > 1;
            });

        $deletedCount = 0;
        foreach ($duplicates as $group) {
            // Keep the first entry, delete the rest
            $toDelete = $group->skip(1);
            foreach ($toDelete as $duplicate) {
                $duplicate->delete();
                $deletedCount++;
            }
        }

        return $deletedCount;
    }

    /**
     * Get formatted history timeline for a document
     */
    public static function getTimeline($documentType, $documentId, $limit = 50)
    {
        return static::where('document_type', $documentType)
            ->where('document_id', $documentId)
            ->with('actionBy')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($entry) {
                return [
                    'id' => $entry->id,
                    'action' => $entry->action,
                    'action_label' => $entry->action_label,
                    'previous_status' => $entry->previous_status,
                    'new_status' => $entry->new_status,
                    'notes' => $entry->notes,
                    'created_at' => $entry->created_at,
                    'action_by' => $entry->actionBy ? [
                        'id' => $entry->actionBy->user_uuid,
                        'name' => $entry->actionBy->name,
                        'email' => $entry->actionBy->email,
                    ] : null,
                ];
            });
    }
}
