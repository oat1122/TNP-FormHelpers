<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add `last_synced_at` timestamp to invoices.
 *
 * Set by SyncService::syncToInvoicesImmediately() whenever a quotation update
 * propagates to its linked invoices. The frontend reads this column to render
 * a "ซิงค์แล้ว" indicator on invoice cards / rows so the user knows the doc
 * has received downstream changes from the parent quotation.
 *
 * Idempotent — guarded by Schema::hasColumn() in case the column already
 * exists in an older environment.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('invoices', 'last_synced_at')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->timestamp('last_synced_at')->nullable()->after('paid_at');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('invoices', 'last_synced_at')) {
            Schema::table('invoices', function (Blueprint $table) {
                // WARNING: dropping this column removes sync-history metadata.
                $table->dropColumn('last_synced_at');
            });
        }
    }
};
