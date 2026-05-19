<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Add composite indexes used by PdfCacheService.
 *
 * PdfCacheService runs two hot query patterns:
 *   1. getCached()  — `cache_key + attachment_type + deleted_at IS NULL`
 *   2. invalidate() — `document_type + document_id + attachment_type + deleted_at IS NULL`
 *
 * On a populated `document_attachments` table both require a table scan
 * without these indexes. The indexes are added defensively (Schema::hasIndex
 * is unreliable across MySQL/MariaDB, so we probe INFORMATION_SCHEMA instead)
 * so the migration is safe to re-run.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('document_attachments')) {
            return;
        }

        Schema::table('document_attachments', function (Blueprint $table) {
            if (! $this->indexExists('document_attachments', 'document_attachments_pdf_cache_key_index')) {
                // Supports getCached() lookups: WHERE cache_key=? AND attachment_type=?
                $table->index(['cache_key', 'attachment_type'], 'document_attachments_pdf_cache_key_index');
            }

            if (! $this->indexExists('document_attachments', 'document_attachments_pdf_cache_doc_index')) {
                // Supports invalidate() lookups: WHERE document_type=? AND document_id=? AND attachment_type=?
                $table->index(
                    ['document_type', 'document_id', 'attachment_type'],
                    'document_attachments_pdf_cache_doc_index'
                );
            }

            if (! $this->indexExists('document_attachments', 'document_attachments_pdf_cache_expires_index')) {
                // Supports cleanupExpired() sweeps: WHERE attachment_type=? AND cache_expires_at <= NOW()
                $table->index(
                    ['attachment_type', 'cache_expires_at'],
                    'document_attachments_pdf_cache_expires_index'
                );
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('document_attachments')) {
            return;
        }

        Schema::table('document_attachments', function (Blueprint $table) {
            foreach ([
                'document_attachments_pdf_cache_key_index',
                'document_attachments_pdf_cache_doc_index',
                'document_attachments_pdf_cache_expires_index',
            ] as $idx) {
                if ($this->indexExists('document_attachments', $idx)) {
                    $table->dropIndex($idx);
                }
            }
        });
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $row = DB::selectOne(
            'SELECT COUNT(*) AS c FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND INDEX_NAME = ?',
            [$table, $indexName]
        );

        return (int) ($row->c ?? 0) > 0;
    }
};
