<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * M9 — Enable foreign-key constraints on accounting tables.
 *
 * The original create migrations (2025_08_05_*) intentionally commented out
 * the foreign-key constraints because the legacy `pricing_requests` and
 * `master_customers` tables have non-standard primary keys (pr_id, cus_id)
 * and their data shape was not yet known to be FK-clean.
 *
 * This migration:
 *   1. NULLs out any orphan FK references (defensive — rows pointing to a
 *      parent that no longer exists).
 *   2. Adds the FK constraints with ON DELETE SET NULL so deleting a
 *      parent does not cascade-destroy children.
 *
 * Before running on production, audit first:
 *
 *   php artisan accounting:audit-fk-orphans
 *
 * This migration is defensive: if `addForeignKey()` fails (e.g. column type
 * mismatch on legacy tables), the failure is logged and the migration
 * continues with the remaining FKs rather than aborting the whole batch.
 */
return new class extends Migration
{
    /**
     * Each entry: [child_table, fk_column, parent_table, parent_pk]
     *
     * @var array<int, array{0:string,1:string,2:string,3:string}>
     */
    private array $links = [
        ['quotations', 'customer_id', 'master_customers', 'cus_id'],
        ['quotations', 'primary_pricing_request_id', 'pricing_requests', 'pr_id'],
        ['invoices', 'quotation_id', 'quotations', 'id'],
        ['invoices', 'customer_id', 'master_customers', 'cus_id'],
        ['receipts', 'invoice_id', 'invoices', 'id'],
        ['receipts', 'customer_id', 'master_customers', 'cus_id'],
    ];

    public function up(): void
    {
        foreach ($this->links as [$child, $fk, $parent, $pk]) {
            if (! Schema::hasTable($child) || ! Schema::hasTable($parent) || ! Schema::hasColumn($child, $fk)) {
                Log::info("M9: skipping {$child}.{$fk} → {$parent}.{$pk} (missing table/column)");

                continue;
            }

            // Step 1 — NULL out orphans so the FK can be added.
            $orphans = DB::table($child)
                ->whereNotNull($fk)
                ->whereNotIn($fk, function ($q) use ($parent, $pk) {
                    $q->select($pk)->from($parent);
                })
                ->update([$fk => null]);

            if ($orphans > 0) {
                Log::info("M9: nulled {$orphans} orphan {$child}.{$fk} → {$parent}.{$pk}");
            }

            // Step 2 — align charset/collation. errno 150 = "Foreign key
            // constraint is incorrectly formed" usually fires when child and
            // parent columns disagree on charset/collation. Normalize both
            // sides to the parent's setting (utf8mb4 / utf8mb4_unicode_ci on
            // the legacy tables) before creating the FK.
            try {
                $this->alignCharset($child, $fk, $parent, $pk);
            } catch (\Throwable $e) {
                Log::warning("M9: failed to align charset for {$child}.{$fk} — ".$e->getMessage());
            }

            // Step 3 — add the FK constraint. Wrapped in try/catch because
            // legacy column-type mismatches would otherwise break the whole
            // migration; we'd rather skip the offending FK and keep the rest.
            try {
                Schema::table($child, function (Blueprint $table) use ($fk, $parent, $pk, $child) {
                    $constraintName = "fk_{$child}_{$fk}";
                    $table->foreign($fk, $constraintName)
                        ->references($pk)
                        ->on($parent)
                        ->onDelete('set null');
                });
                Log::info("M9: added FK {$child}.{$fk} → {$parent}.{$pk}");
            } catch (\Throwable $e) {
                Log::warning("M9: failed to add FK {$child}.{$fk} → {$parent}.{$pk} — ".$e->getMessage());
            }
        }
    }

    /**
     * If child column charset/collation differs from the parent's, ALTER the
     * child column to match. This avoids the common errno 150 caused by
     * legacy tables created under utf8 vs the newer utf8mb4 schema.
     */
    private function alignCharset(string $child, string $fk, string $parent, string $pk): void
    {
        $childCol = DB::selectOne(
            'SELECT COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME, IS_NULLABLE
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [$child, $fk]
        );
        $parentCol = DB::selectOne(
            'SELECT COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [$parent, $pk]
        );

        if (! $childCol || ! $parentCol) {
            return;
        }

        $charsetMismatch = $childCol->CHARACTER_SET_NAME !== $parentCol->CHARACTER_SET_NAME;
        $collationMismatch = $childCol->COLLATION_NAME !== $parentCol->COLLATION_NAME;

        if (! $charsetMismatch && ! $collationMismatch) {
            return;
        }

        $nullable = $childCol->IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        $sql = sprintf(
            'ALTER TABLE %s MODIFY %s %s CHARACTER SET %s COLLATE %s %s',
            $child,
            $fk,
            $childCol->COLUMN_TYPE,
            $parentCol->CHARACTER_SET_NAME,
            $parentCol->COLLATION_NAME,
            $nullable
        );

        DB::statement($sql);
        Log::info("M9: aligned {$child}.{$fk} charset/collation to match {$parent}.{$pk}");
    }

    public function down(): void
    {
        foreach ($this->links as [$child, $fk, $parent, $pk]) {
            if (! Schema::hasTable($child)) {
                continue;
            }

            try {
                Schema::table($child, function (Blueprint $table) use ($fk, $child) {
                    $constraintName = "fk_{$child}_{$fk}";
                    $table->dropForeign($constraintName);
                });
                Log::info("M9 rollback: dropped FK {$child}.{$fk}");
            } catch (\Throwable $e) {
                Log::warning("M9 rollback: failed to drop FK {$child}.{$fk} — ".$e->getMessage());
            }
        }
    }
};
