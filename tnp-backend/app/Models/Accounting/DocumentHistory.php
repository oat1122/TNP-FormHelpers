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
        return static::create([
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
}
