<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // quotations
        Schema::table('quotations', function (Blueprint $table) {
            if (!Schema::hasColumn('quotations', 'company_id')) {
                $table->char('company_id', 36)->nullable()->after('id')->index();
            }
            // make number not globally unique if exists; keep index
            try { $table->dropUnique(['number']); } catch (Throwable $e) {}
            $table->index(['company_id', 'number']);
        });

        // invoices
        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'company_id')) {
                $table->char('company_id', 36)->nullable()->after('id')->index();
            }
            try { $table->dropUnique(['number']); } catch (Throwable $e) {}
            $table->index(['company_id', 'number']);
        });

        // receipts
        Schema::table('receipts', function (Blueprint $table) {
            if (!Schema::hasColumn('receipts', 'company_id')) {
                $table->char('company_id', 36)->nullable()->after('id')->index();
            }
            try { $table->dropUnique(['number']); } catch (Throwable $e) {}
            $table->index(['company_id', 'number']);
        });

        // delivery_notes
        Schema::table('delivery_notes', function (Blueprint $table) {
            if (!Schema::hasColumn('delivery_notes', 'company_id')) {
                $table->char('company_id', 36)->nullable()->after('id')->index();
            }
            try { $table->dropUnique(['number']); } catch (Throwable $e) {}
            $table->index(['company_id', 'number']);
        });
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            if (Schema::hasColumn('quotations', 'company_id')) {
                $table->dropIndex(['company_id']);
                $table->dropIndex(['company_id', 'number']);
                $table->dropColumn('company_id');
            }
        });
        Schema::table('invoices', function (Blueprint $table) {
            if (Schema::hasColumn('invoices', 'company_id')) {
                $table->dropIndex(['company_id']);
                $table->dropIndex(['company_id', 'number']);
                $table->dropColumn('company_id');
            }
        });
        Schema::table('receipts', function (Blueprint $table) {
            if (Schema::hasColumn('receipts', 'company_id')) {
                $table->dropIndex(['company_id']);
                $table->dropIndex(['company_id', 'number']);
                $table->dropColumn('company_id');
            }
        });
        Schema::table('delivery_notes', function (Blueprint $table) {
            if (Schema::hasColumn('delivery_notes', 'company_id')) {
                $table->dropIndex(['company_id']);
                $table->dropIndex(['company_id', 'number']);
                $table->dropColumn('company_id');
            }
        });
    }
};
