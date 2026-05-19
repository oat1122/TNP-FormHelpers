<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Idempotent re-application of `2026_05_06_090000_add_side_override_fields_to_invoices_table`.
 *
 * The original migration is recorded as "Ran" in some environments while the
 * actual columns are missing on the `invoices` table — likely a residue of an
 * older fresh/rollback cycle. Updating an invoice then fails with:
 *   SQLSTATE[42S22]: Column not found: 'due_date_before'
 *
 * This migration adds each column only when it does not already exist, so it
 * is safe to run on environments where the original migration applied
 * correctly (no-op) AND on those where it did not (back-fills the columns).
 *
 * Per-side override semantics: null = use the legacy atomic column value.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (! Schema::hasColumn('invoices', 'due_date_before')) {
                $table->date('due_date_before')->nullable()->after('due_date');
            }
            if (! Schema::hasColumn('invoices', 'due_date_after')) {
                $table->date('due_date_after')->nullable()->after('due_date_before');
            }
            if (! Schema::hasColumn('invoices', 'paid_amount_before')) {
                $table->decimal('paid_amount_before', 12, 2)->nullable()->after('paid_amount');
            }
            if (! Schema::hasColumn('invoices', 'paid_amount_after')) {
                $table->decimal('paid_amount_after', 12, 2)->nullable()->after('paid_amount_before');
            }
            if (! Schema::hasColumn('invoices', 'notes_before')) {
                $table->text('notes_before')->nullable()->after('notes');
            }
            if (! Schema::hasColumn('invoices', 'notes_after')) {
                $table->text('notes_after')->nullable()->after('notes_before');
            }
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // WARNING: dropping these columns will permanently delete per-side override data.
            // Down() only drops columns that exist so it does not collide with the original
            // migration's down() if both are rolled back in sequence.
            $columns = array_filter([
                Schema::hasColumn('invoices', 'notes_after') ? 'notes_after' : null,
                Schema::hasColumn('invoices', 'notes_before') ? 'notes_before' : null,
                Schema::hasColumn('invoices', 'paid_amount_after') ? 'paid_amount_after' : null,
                Schema::hasColumn('invoices', 'paid_amount_before') ? 'paid_amount_before' : null,
                Schema::hasColumn('invoices', 'due_date_after') ? 'due_date_after' : null,
                Schema::hasColumn('invoices', 'due_date_before') ? 'due_date_before' : null,
            ]);
            if (! empty($columns)) {
                $table->dropColumn(array_values($columns));
            }
        });
    }
};
