<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;

class DocumentStatusHistory extends Model
{
    use HasFactory;

    protected $table = 'document_status_history';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'document_id',
        'document_type',
        'status_from',
        'status_to',
        'action_type',
        'remarks',
        'changed_by',
        'changed_at'
    ];

    protected $casts = [
        'changed_at' => 'datetime'
    ];

    // Document types
    const DOCUMENT_TYPE_QUOTATION = 'quotation';
    const DOCUMENT_TYPE_INVOICE = 'invoice';
    const DOCUMENT_TYPE_RECEIPT = 'receipt';
    const DOCUMENT_TYPE_DELIVERY_NOTE = 'delivery_note';

    // Action types
    const ACTION_TYPE_CREATE = 'create';
    const ACTION_TYPE_UPDATE = 'update';
    const ACTION_TYPE_DELETE = 'delete';
    const ACTION_TYPE_APPROVE = 'approve';
    const ACTION_TYPE_REJECT = 'reject';
    const ACTION_TYPE_REVERT = 'revert';

    /**
     * Relationship: DocumentStatusHistory belongs to User
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by', 'user_uuid');
    }

    /**
     * Scope: Filter by document type
     */
    public function scopeByDocumentType($query, $documentType)
    {
        return $query->where('document_type', $documentType);
    }

    /**
     * Scope: Filter by document ID
     */
    public function scopeByDocument($query, $documentId)
    {
        return $query->where('document_id', $documentId);
    }

    /**
     * Scope: Filter by action type
     */
    public function scopeByActionType($query, $actionType)
    {
        return $query->where('action_type', $actionType);
    }
}
