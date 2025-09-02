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
        Schema::table('invoices', function (Blueprint $table) {
            // เพิ่มฟิลด์ VAT
            $table->boolean('has_vat')->default(true)->after('total_amount')->comment('มีภาษีมูลค่าเพิ่มหรือไม่');
            $table->decimal('vat_percentage', 5, 2)->default(7.00)->after('has_vat')->comment('อัตราภาษีมูลค่าเพิ่ม (%)');
            $table->decimal('vat_amount', 15, 2)->default(0)->after('vat_percentage')->comment('จำนวนเงินภาษีมูลค่าเพิ่ม');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // ลบฟิลด์ VAT
            $table->dropColumn(['has_vat', 'vat_percentage', 'vat_amount']);
        });
    }
};
