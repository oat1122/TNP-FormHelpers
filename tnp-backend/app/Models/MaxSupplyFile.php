<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class MaxSupplyFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'max_supply_id',
        'original_name',
        'stored_name',
        'file_path',
        'file_type',
        'mime_type',
        'file_size',
        'description',
        'uploaded_by',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    // Relationships
    public function maxSupply(): BelongsTo
    {
        return $this->belongsTo(MaxSupply::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // Scopes
    public function scopeByType($query, $type)
    {
        return $query->where('file_type', $type);
    }

    public function scopeImages($query)
    {
        return $query->where('file_type', 'image');
    }

    public function scopeDocuments($query)
    {
        return $query->where('file_type', 'document');
    }

    // Accessors
    public function getUrlAttribute()
    {
        return Storage::url($this->file_path);
    }

    public function getFullPathAttribute()
    {
        return Storage::path($this->file_path);
    }

    public function getFormattedSizeAttribute()
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    public function getIsImageAttribute()
    {
        return $this->file_type === 'image';
    }

    public function getIsDocumentAttribute()
    {
        return $this->file_type === 'document';
    }

    // Methods
    public function delete()
    {
        // Delete physical file
        if (Storage::exists($this->file_path)) {
            Storage::delete($this->file_path);
        }
        
        // Delete database record
        return parent::delete();
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($file) {
            // Ensure physical file is deleted when model is deleted
            if (Storage::exists($file->file_path)) {
                Storage::delete($file->file_path);
            }
        });
    }
}
