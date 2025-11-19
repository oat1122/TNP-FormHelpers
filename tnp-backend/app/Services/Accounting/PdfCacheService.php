<?php

namespace App\Services\Accounting;

use App\Models\Accounting\DocumentAttachment;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * PDF Cache Service
 * 
 * Manages PDF caching with organized directory structure:
 * storage/app/public/pdfs-cache/{document_type}/{year}/{month}/
 */
class PdfCacheService
{
    /**
     * TTL configurations based on document status (in minutes)
     */
    const TTL_DRAFT = 30;           // 30 minutes
    const TTL_APPROVED = 1440;      // 24 hours
    const TTL_SENT = 10080;         // 7 days
    const TTL_COMPLETED = 10080;    // 7 days

    /**
     * Get cached PDF if available and valid
     * 
     * @param string $documentType (quotation, invoice, receipt, delivery_note)
     * @param string $documentId
     * @param array $options (document_header_type, deposit_mode, etc.)
     * @return array|null ['path' => string, 'url' => string, 'size' => int, 'cached_at' => datetime] or null
     */
    public function getCached(string $documentType, string $documentId, array $options = []): ?array
    {
        try {
            // Get document to calculate cache version
            $document = $this->getDocument($documentType, $documentId);
            if (!$document) {
                return null;
            }

            // Generate cache key
            $cacheKey = $this->generateCacheKey($documentType, $documentId, $options, $document);
            
            // Find cache entry
            $cacheEntry = DocumentAttachment::where('cache_key', $cacheKey)
                ->where('attachment_type', 'cached_pdf')
                ->whereNull('deleted_at')
                ->where(function($query) {
                    $query->whereNull('cache_expires_at')
                          ->orWhere('cache_expires_at', '>', Carbon::now());
                })
                ->first();

            if (!$cacheEntry) {
                Log::info("PDF Cache MISS", ['cache_key' => $cacheKey]);
                return null;
            }

            // Check if file exists
            $fullPath = storage_path('app/public/' . $cacheEntry->file_path);
            if (!file_exists($fullPath)) {
                Log::warning("PDF Cache entry exists but file missing", [
                    'cache_key' => $cacheKey,
                    'path' => $fullPath
                ]);
                // Clean up invalid cache entry
                $cacheEntry->delete();
                return null;
            }

            Log::info("PDF Cache HIT", [
                'cache_key' => $cacheKey,
                'expires_at' => $cacheEntry->cache_expires_at
            ]);

            return [
                'path' => $fullPath,
                'url' => asset('storage/' . $cacheEntry->file_path),
                'filename' => $cacheEntry->filename,
                'size' => $cacheEntry->file_size,
                'cached_at' => $cacheEntry->created_at,
                'expires_at' => $cacheEntry->cache_expires_at,
                'cache_version' => $cacheEntry->cache_version,
                'from_cache' => true
            ];

        } catch (\Exception $e) {
            Log::error("PDF Cache getCached error: " . $e->getMessage(), [
                'document_type' => $documentType,
                'document_id' => $documentId
            ]);
            return null;
        }
    }

    /**
     * Store PDF in cache with organized directory structure
     * 
     * @param object $document Document model instance
     * @param string $pdfPath Full path to generated PDF file
     * @param array $options PDF generation options
     * @return array Cache entry data
     */
    public function store($document, string $pdfPath, array $options = []): array
    {
        try {
            $documentType = $this->getDocumentType($document);
            $documentId = $document->id;

            // Calculate cache version
            $cacheVersion = $this->calculateCacheVersion($document);
            
            // Generate cache key
            $cacheKey = $this->generateCacheKey($documentType, $documentId, $options, $document);

            // Calculate TTL based on document status
            $ttlMinutes = $this->calculateTTL($document);
            $expiresAt = $ttlMinutes > 0 ? Carbon::now()->addMinutes($ttlMinutes) : null;

            // Get organized storage path
            $storagePath = $this->getStoragePath($documentType, Carbon::now());
            $storageFullPath = storage_path('app/public/' . $storagePath);
            
            // Create directory if not exists
            if (!is_dir($storageFullPath)) {
                mkdir($storageFullPath, 0755, true);
            }

            // Generate unique filename
            $headerType = $options['document_header_type'] ?? 'default';
            $headerTypeSafe = $this->sanitizeFilename($headerType);
            $timestamp = Carbon::now()->format('YmdHis');
            $filename = sprintf(
                '%s-%s-%s-%s.pdf',
                $documentType,
                $document->number ?? $documentId,
                $headerTypeSafe,
                $timestamp
            );

            // Copy PDF to cache location
            $destinationPath = $storageFullPath . DIRECTORY_SEPARATOR . $filename;
            if (!copy($pdfPath, $destinationPath)) {
                throw new \Exception("Failed to copy PDF to cache location");
            }

            // Get file size
            $fileSize = filesize($destinationPath);

            // Get current user ID (try multiple authentication methods)
            $uploadedBy = null;
            if (auth()->check()) {
                $uploadedBy = auth()->user()->user_uuid ?? auth()->id();
            } elseif (!empty($options['user_id'])) {
                $uploadedBy = $options['user_id'];
            } elseif (!empty($document->created_by)) {
                $uploadedBy = $document->created_by;
            }

            // Store cache entry in database
            $cacheEntry = DocumentAttachment::create([
                'document_type' => $documentType,
                'document_id' => $documentId,
                'attachment_type' => 'cached_pdf',
                'filename' => $filename,
                'original_filename' => $filename,
                'file_path' => $storagePath . $filename,
                'file_size' => $fileSize,
                'mime_type' => 'application/pdf',
                'cache_expires_at' => $expiresAt,
                'cache_version' => $cacheVersion,
                'cache_key' => $cacheKey,
                'uploaded_by' => $uploadedBy
            ]);

            Log::info("PDF Cache STORED", [
                'cache_key' => $cacheKey,
                'path' => $storagePath . $filename,
                'ttl_minutes' => $ttlMinutes,
                'expires_at' => $expiresAt
            ]);

            return [
                'cache_entry_id' => $cacheEntry->id,
                'path' => $destinationPath,
                'url' => asset('storage/' . $storagePath . $filename),
                'filename' => $filename,
                'size' => $fileSize,
                'expires_at' => $expiresAt,
                'ttl_minutes' => $ttlMinutes
            ];

        } catch (\Exception $e) {
            Log::error("PDF Cache store error: " . $e->getMessage(), [
                'document_type' => $documentType ?? 'unknown',
                'document_id' => $documentId ?? 'unknown'
            ]);
            throw $e;
        }
    }

    /**
     * Invalidate cache for a specific document
     * 
     * @param string $documentType
     * @param string $documentId
     * @return int Number of cache entries invalidated
     */
    public function invalidate(string $documentType, string $documentId): int
    {
        try {
            $entries = DocumentAttachment::where('document_type', $documentType)
                ->where('document_id', $documentId)
                ->where('attachment_type', 'cached_pdf')
                ->whereNull('deleted_at')
                ->get();

            $count = 0;
            foreach ($entries as $entry) {
                // Soft delete the cache entry
                $entry->update(['deleted_at' => Carbon::now()]);
                
                // Optionally delete physical file immediately or wait for cleanup
                // $this->deletePhysicalFile($entry->file_path);
                
                $count++;
            }

            Log::info("PDF Cache INVALIDATED", [
                'document_type' => $documentType,
                'document_id' => $documentId,
                'count' => $count
            ]);

            return $count;

        } catch (\Exception $e) {
            Log::error("PDF Cache invalidate error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Generate unique cache key
     * 
     * @param string $documentType
     * @param string $documentId
     * @param array $options
     * @param object $document
     * @return string
     */
    public function generateCacheKey(string $documentType, string $documentId, array $options, $document): string
    {
        $headerType = $options['document_header_type'] ?? 'default';
        $depositMode = $options['deposit_mode'] ?? 'default';
        $cacheVersion = $this->calculateCacheVersion($document);

        return sprintf(
            '%s:%s:%s:%s:%s',
            $documentType,
            $documentId,
            $headerType,
            $depositMode,
            $cacheVersion
        );
    }

    /**
     * Calculate cache version hash from document data
     * 
     * @param object $document
     * @return string MD5 hash
     */
    public function calculateCacheVersion($document): string
    {
        $data = [
            'updated_at' => $document->updated_at ? $document->updated_at->timestamp : time(),
            'customer_id' => $document->customer_id ?? null,
            'status' => $document->status ?? null,
            'total_amount' => $document->total_amount ?? null,
        ];

        // Add items data if available
        if (method_exists($document, 'items') && $document->relationLoaded('items')) {
            $data['items'] = $document->items->map(function($item) {
                return [
                    'id' => $item->id,
                    'quantity' => $item->quantity ?? null,
                    'unit_price' => $item->unit_price ?? null,
                ];
            })->toArray();
        }

        return md5(serialize($data));
    }

    /**
     * Calculate TTL based on document status
     * 
     * @param object $document
     * @return int TTL in minutes
     */
    protected function calculateTTL($document): int
    {
        $status = strtolower($document->status ?? 'draft');

        // Map status to TTL
        if (in_array($status, ['draft', 'pending'])) {
            return self::TTL_DRAFT;
        }

        if (in_array($status, ['approved'])) {
            return self::TTL_APPROVED;
        }

        if (in_array($status, ['sent', 'completed', 'delivered'])) {
            return self::TTL_SENT;
        }

        // Default to draft TTL
        return self::TTL_DRAFT;
    }

    /**
     * Get organized storage path based on document type and date
     * 
     * @param string $documentType
     * @param Carbon $date
     * @return string Relative path like 'pdfs-cache/invoice/2025/11/'
     */
    protected function getStoragePath(string $documentType, Carbon $date): string
    {
        return sprintf(
            'pdfs-cache/%s/%s/%s/',
            $documentType,
            $date->format('Y'),
            $date->format('m')
        );
    }

    /**
     * Clean up expired cache entries
     * 
     * @param int $softDeleteGracePeriodHours Hours to keep soft-deleted files before physical deletion
     * @return array ['deleted_count' => int, 'freed_space' => int]
     */
    public function cleanupExpired(int $softDeleteGracePeriodHours = 24): array
    {
        try {
            $deletedCount = 0;
            $freedSpace = 0;

            // Find expired cache entries
            $expiredEntries = DocumentAttachment::where('attachment_type', 'cached_pdf')
                ->where(function($query) {
                    $query->where('cache_expires_at', '<=', Carbon::now())
                          ->orWhere('deleted_at', '<=', Carbon::now()->subHours(24));
                })
                ->get();

            foreach ($expiredEntries as $entry) {
                $fullPath = storage_path('app/public/' . $entry->file_path);
                
                if (file_exists($fullPath)) {
                    $freedSpace += filesize($fullPath);
                    unlink($fullPath);
                }

                $entry->forceDelete(); // Hard delete from database
                $deletedCount++;
            }

            // Clean up empty directories
            $this->cleanupEmptyDirectories();

            Log::info("PDF Cache CLEANUP completed", [
                'deleted_count' => $deletedCount,
                'freed_space_mb' => round($freedSpace / 1024 / 1024, 2)
            ]);

            return [
                'deleted_count' => $deletedCount,
                'freed_space' => $freedSpace
            ];

        } catch (\Exception $e) {
            Log::error("PDF Cache cleanup error: " . $e->getMessage());
            return ['deleted_count' => 0, 'freed_space' => 0];
        }
    }

    /**
     * Clean up empty directories in cache structure
     */
    protected function cleanupEmptyDirectories(): void
    {
        $basePath = storage_path('app/public/pdfs-cache');
        if (!is_dir($basePath)) {
            return;
        }

        // Recursively find and remove empty directories
        $this->removeEmptySubfolders($basePath);
    }

    /**
     * Recursively remove empty subdirectories
     * 
     * @param string $path
     */
    protected function removeEmptySubfolders(string $path): void
    {
        $empty = true;
        foreach (glob($path . DIRECTORY_SEPARATOR . '*') as $file) {
            if (is_dir($file)) {
                $this->removeEmptySubfolders($file);
                if (is_dir($file)) {
                    $empty = false;
                }
            } else {
                $empty = false;
            }
        }
        
        if ($empty && $path !== storage_path('app/public/pdfs-cache')) {
            @rmdir($path);
        }
    }

    /**
     * Get cache statistics
     * 
     * @return array
     */
    public function getStatistics(): array
    {
        $totalEntries = DocumentAttachment::where('attachment_type', 'cached_pdf')
            ->whereNull('deleted_at')
            ->count();

        $totalSize = DocumentAttachment::where('attachment_type', 'cached_pdf')
            ->whereNull('deleted_at')
            ->sum('file_size');

        $expiredCount = DocumentAttachment::where('attachment_type', 'cached_pdf')
            ->whereNull('deleted_at')
            ->where('cache_expires_at', '<=', Carbon::now())
            ->count();

        $byDocumentType = DocumentAttachment::where('attachment_type', 'cached_pdf')
            ->whereNull('deleted_at')
            ->selectRaw('document_type, COUNT(*) as count, SUM(file_size) as size')
            ->groupBy('document_type')
            ->get();

        return [
            'total_entries' => $totalEntries,
            'total_size_bytes' => $totalSize,
            'total_size_mb' => round($totalSize / 1024 / 1024, 2),
            'expired_count' => $expiredCount,
            'by_document_type' => $byDocumentType->toArray()
        ];
    }

    /**
     * Get document model instance
     * 
     * @param string $documentType
     * @param string $documentId
     * @return object|null
     */
    protected function getDocument(string $documentType, string $documentId)
    {
        $modelMap = [
            'quotation' => \App\Models\Accounting\Quotation::class,
            'invoice' => \App\Models\Accounting\Invoice::class,
            'receipt' => \App\Models\Accounting\Receipt::class,
            'delivery_note' => \App\Models\Accounting\DeliveryNote::class,
        ];

        $modelClass = $modelMap[$documentType] ?? null;
        if (!$modelClass) {
            return null;
        }

        return $modelClass::with('items')->find($documentId);
    }

    /**
     * Get document type from model instance
     * 
     * @param object $document
     * @return string
     */
    protected function getDocumentType($document): string
    {
        $class = get_class($document);
        
        if (str_contains($class, 'Quotation')) return 'quotation';
        if (str_contains($class, 'Invoice')) return 'invoice';
        if (str_contains($class, 'Receipt')) return 'receipt';
        if (str_contains($class, 'DeliveryNote')) return 'delivery_note';
        
        return 'unknown';
    }

    /**
     * Sanitize filename for safe filesystem storage
     * 
     * @param string $filename
     * @return string
     */
    protected function sanitizeFilename(string $filename): string
    {
        // Replace Thai and special characters with safe alternatives
        $filename = preg_replace('/[^a-zA-Z0-9\-_]/', '-', $filename);
        return substr($filename, 0, 50); // Limit length
    }

    /**
     * Delete physical file
     * 
     * @param string $relativePath
     * @return bool
     */
    protected function deletePhysicalFile(string $relativePath): bool
    {
        $fullPath = storage_path('app/public/' . $relativePath);
        if (file_exists($fullPath)) {
            return unlink($fullPath);
        }
        return false;
    }
}
