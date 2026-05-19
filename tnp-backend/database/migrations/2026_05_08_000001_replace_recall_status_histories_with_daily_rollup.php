<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Replace `recall_status_histories` (per-customer daily snapshot, "A") with
 * `recall_daily_rollup` (aggregated daily counts per source × manage_by, "F").
 *
 * Why:
 *   - The per-customer snapshot was overkill: drill-down is now the live
 *     `/sales/customer-care/customers` route in tnp-ceo-report which computes
 *     status from current state via Drizzle reads.
 *   - We only need historical *trend* (count over time), not which specific
 *     customer was overdue on day X. The aggregated rollup gives us that for
 *     ~50 rows/day vs ~1000 rows/day.
 *
 * Ownership:
 *   - DDL stays in Laravel (this migration).
 *   - Snapshot writes happen from tnp-ceo-report (Next.js Route Handler
 *     triggered by an external cron) — see ceo-report/.claude/rules/db-access.md
 *     for the write-scoped DB user exception.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('recall_status_histories');

        Schema::create('recall_daily_rollup', function (Blueprint $table) {
            $table->date('snapshot_date');
            $table->enum('source', ['sales', 'telesales', 'online', 'office']);
            $table->unsignedBigInteger('manage_by');

            $table->unsignedInteger('total_customers')->default(0);
            $table->unsignedInteger('overdue_count')->default(0);
            $table->unsignedInteger('in_criteria_count')->default(0);
            $table->unsignedInteger('recalls_made_count')->default(0);

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            // Composite PK — uniquely identifies one bucket per day
            $table->primary(['snapshot_date', 'source', 'manage_by'], 'pk_recall_daily_rollup');

            // Hot index for trend chart queries: WHERE snapshot_date BETWEEN ?
            $table->index('snapshot_date', 'idx_snapshot_date');
            $table->index('manage_by', 'idx_manage_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recall_daily_rollup');

        // Restore the previous shape so `php artisan migrate:rollback` puts the
        // schema back to where the prior migration left it. Indexes mirror
        // 2026_02_27_143838_create_recall_status_histories_table.php.
        Schema::create('recall_status_histories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('snapshot_date');
            $table->char('customer_id', 36);
            $table->string('customer_name', 255)->nullable();
            $table->char('customer_group_id', 36)->nullable();
            $table->enum('source', ['sales', 'telesales', 'online', 'office'])->nullable();
            $table->unsignedBigInteger('manage_by')->nullable();
            $table->enum('recall_status', ['overdue', 'in_criteria']);
            $table->dateTime('cd_last_datetime')->nullable();
            $table->integer('days_overdue')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['snapshot_date', 'customer_id'], 'idx_unique_daily');
            $table->index('snapshot_date', 'idx_date');
            $table->index('manage_by', 'idx_manage_by');
            $table->index('recall_status', 'idx_status');
            $table->index('customer_id', 'idx_customer');
        });
    }
};
