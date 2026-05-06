<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-side override fields for Invoice (มัดจำก่อน / มัดจำหลัง).
 *
 * Each invoice has 2 sides (deposit "before" and remaining "after"). Until now
 * due_date / paid_amount / notes were single atomic columns shared by both
 * sides. This migration adds nullable per-side overrides so users can edit
 * each side independently in InvoiceDetailDialog.
 *
 * Null = use the legacy atomic value (backward-compat for existing rows).
 *
 * See: tnp-frontend/docs/audits/plans/invoice-side-edit.md (Phase 1).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->date('due_date_before')->nullable()->after('due_date');
            $table->date('due_date_after')->nullable()->after('due_date_before');

            $table->decimal('paid_amount_before', 12, 2)->nullable()->after('paid_amount');
            $table->decimal('paid_amount_after', 12, 2)->nullable()->after('paid_amount_before');

            $table->text('notes_before')->nullable()->after('notes');
            $table->text('notes_after')->nullable()->after('notes_before');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // WARNING: dropping these columns will permanently delete per-side override data
            $table->dropColumn([
                'due_date_before',
                'due_date_after',
                'paid_amount_before',
                'paid_amount_after',
                'notes_before',
                'notes_after',
            ]);
        });
    }
};
