<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('document_attachments', function (Blueprint $table) {
            // Add attachment_type to distinguish between evidence and cached PDFs
            $table->enum('attachment_type', ['evidence', 'signature', 'cached_pdf'])
                  ->default('evidence')
                  ->after('document_id')
                  ->comment('ประเภทไฟล์แนบ: evidence=หลักฐาน, signature=ลายเซ็น, cached_pdf=PDF แคช');
            
            // PDF cache metadata
            $table->datetime('cache_expires_at')
                  ->nullable()
                  ->after('mime_type')
                  ->comment('เวลาหมดอายุของ PDF cache');
            
            $table->string('cache_version', 32)
                  ->nullable()
                  ->after('cache_expires_at')
                  ->comment('Version hash ของเอกสาร (MD5) สำหรับ cache invalidation');
            
            $table->string('cache_key', 255)
                  ->nullable()
                  ->after('cache_version')
                  ->comment('Unique cache key: {type}:{id}:{header}:{version}');
            
            // Soft delete support for cache
            $table->timestamp('deleted_at')
                  ->nullable()
                  ->after('created_at')
                  ->comment('Soft delete timestamp for cache cleanup');
            
            // Add composite index for cache lookup
            $table->index(['document_type', 'document_id', 'attachment_type', 'cache_expires_at'], 'idx_cache_lookup');
            
            // Add unique index for cache_key
            $table->unique('cache_key', 'idx_unique_cache_key');
            
            // Add index for cache cleanup
            $table->index(['attachment_type', 'cache_expires_at', 'deleted_at'], 'idx_cache_cleanup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_attachments', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex('idx_cache_lookup');
            $table->dropUnique('idx_unique_cache_key');
            $table->dropIndex('idx_cache_cleanup');
            
            // Drop columns
            $table->dropColumn([
                'attachment_type',
                'cache_expires_at',
                'cache_version',
                'cache_key',
                'deleted_at'
            ]);
        });
    }
};
