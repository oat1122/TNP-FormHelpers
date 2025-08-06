<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

/**
 * Class DocumentAttachment
 * 
 * @property string $id
 * @property string $document_type
 * @property string $document_id
 * @property string $filename
 * @property string $original_filename
 * @property string $file_path
 * @property int|null $file_size
 * @property string|null $mime_type
 * @property string|null $uploaded_by
 * @property \Carbon\Carbon $created_at
 */
class DocumentAttachment extends Model
{
    protected $table = 'document_attachments';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false; // Only using created_at

    protected $fillable = [
        'id',
        'document_type',
        'document_id',
        'filename',
        'original_filename',
        'file_path',
        'file_size',
        'mime_type',
        'uploaded_by'
    ];

    protected $casts = [
        'file_size' => 'integer',
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
     * Relationship: DocumentAttachment belongs to User who uploaded
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by', 'user_uuid');
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
     * Scope: Filter by file type
     */
    public function scopeFileType($query, $mimeType)
    {
        return $query->where('mime_type', 'like', $mimeType . '%');
    }

    /**
     * Get file URL
     */
    public function getFileUrlAttribute()
    {
        if (file_exists(storage_path('app/' . $this->file_path))) {
            return url('storage/' . str_replace('public/', '', $this->file_path));
        }
        
        return null;
    }

    /**
     * Get file size in human readable format
     */
    public function getFileSizeHumanAttribute()
    {
        if (!$this->file_size) {
            return 'Unknown';
        }

        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Get file extension
     */
    public function getFileExtensionAttribute()
    {
        return pathinfo($this->original_filename, PATHINFO_EXTENSION);
    }

    /**
     * Check if file is an image
     */
    public function isImage()
    {
        return $this->mime_type && str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Check if file is a PDF
     */
    public function isPdf()
    {
        return $this->mime_type === 'application/pdf';
    }

    /**
     * Check if file is a document
     */
    public function isDocument()
    {
        $documentMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
        ];

        return in_array($this->mime_type, $documentMimes);
    }

    /**
     * Get file type icon
     */
    public function getFileIconAttribute()
    {
        if ($this->isImage()) {
            return 'fa-image';
        } elseif ($this->isPdf()) {
            return 'fa-file-pdf';
        } elseif (str_contains($this->mime_type, 'word')) {
            return 'fa-file-word';
        } elseif (str_contains($this->mime_type, 'excel') || str_contains($this->mime_type, 'spreadsheet')) {
            return 'fa-file-excel';
        } elseif (str_contains($this->mime_type, 'text')) {
            return 'fa-file-text';
        } else {
            return 'fa-file';
        }
    }

    /**
     * Delete file from storage when model is deleted
     */
    protected static function booted()
    {
        static::deleting(function ($attachment) {
            if (file_exists(storage_path('app/' . $attachment->file_path))) {
                unlink(storage_path('app/' . $attachment->file_path));
            }
        });
    }

    /**
     * Create attachment record for uploaded file
     */
    public static function createFromUpload($documentType, $documentId, $uploadedFile, $uploadedBy = null)
    {
        // Generate unique filename
        $extension = $uploadedFile->getClientOriginalExtension();
        $filename = time() . '_' . \Illuminate\Support\Str::random(10) . '.' . $extension;
        
        // Store file
        $path = $uploadedFile->storeAs('public/attachments/' . $documentType, $filename);
        
        return static::create([
            'document_type' => $documentType,
            'document_id' => $documentId,
            'filename' => $filename,
            'original_filename' => $uploadedFile->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $uploadedFile->getSize(),
            'mime_type' => $uploadedFile->getMimeType(),
            'uploaded_by' => $uploadedBy ?? auth()->user()->user_uuid ?? null
        ]);
    }
}
