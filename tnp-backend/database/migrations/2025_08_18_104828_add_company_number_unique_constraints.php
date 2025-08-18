<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // เพิ่ม unique(company_id, number) ให้เอกสารหลักทุกประเภท
        Schema::table('quotations', function (Blueprint $table) {
            try { $table->unique(['company_id','number'], 'uniq_quotations_company_number'); } catch (\Throwable $e) {}
        });
        Schema::table('invoices', function (Blueprint $table) {
            try { $table->unique(['company_id','number'], 'uniq_invoices_company_number'); } catch (\Throwable $e) {}
        });
        Schema::table('receipts', function (Blueprint $table) {
            try { $table->unique(['company_id','number'], 'uniq_receipts_company_number'); } catch (\Throwable $e) {}
        });
        Schema::table('delivery_notes', function (Blueprint $table) {
            try { $table->unique(['company_id','number'], 'uniq_dn_company_number'); } catch (\Throwable $e) {}
        });
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            try { $table->dropUnique('uniq_quotations_company_number'); } catch (\Throwable $e) {}
        });
        Schema::table('invoices', function (Blueprint $table) {
            try { $table->dropUnique('uniq_invoices_company_number'); } catch (\Throwable $e) {}
        });
        Schema::table('receipts', function (Blueprint $table) {
            try { $table->dropUnique('uniq_receipts_company_number'); } catch (\Throwable $e) {}
        });
        Schema::table('delivery_notes', function (Blueprint $table) {
            try { $table->dropUnique('uniq_dn_company_number'); } catch (\Throwable $e) {}
        });
    }
};
