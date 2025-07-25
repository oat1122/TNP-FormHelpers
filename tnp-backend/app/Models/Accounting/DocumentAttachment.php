<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;

class DocumentAttachment extends Model
{
    use HasFactory;

    protected $table = 'document_attachments';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'document_id',
        'document_type',
        'file_name',
        'original_name',
        'file_path',
        'file_size',
        'file_type',
        'uploaded_by'
    ];

    protected $casts = [
        'file_size' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Document types
    const DOCUMENT_TYPE_QUOTATION = 'quotation';
    const DOCUMENT_TYPE_INVOICE = 'invoice';
    const DOCUMENT_TYPE_RECEIPT = 'receipt';
    const DOCUMENT_TYPE_DELIVERY_NOTE = 'delivery_note';

    // Allowed file types
    const ALLOWED_FILE_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    /**
     * Relationship: DocumentAttachment belongs to User
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by', 'user_uuid');
    }

    /**
     * Get file URL
     */
    public function getFileUrlAttribute(): string
    {
        return url('storage/' . $this->file_path);
    }

    /**
     * Get human readable file size
     */
    public function getFileSizeHumanAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Check if file type is allowed
     */
    public static function isAllowedFileType(string $fileType): bool
    {
        return in_array($fileType, self::ALLOWED_FILE_TYPES);
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
}
