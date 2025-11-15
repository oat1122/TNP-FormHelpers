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
            // Add net_subtotal after subtotal
            $table->decimal('net_subtotal', 15, 2)
                ->nullable()
                ->after('subtotal')
                ->comment('ยอดสุทธิก่อนภาษี (สำหรับโหมดรวม VAT)');
            
            // Add pricing_mode after vat_percentage
            $table->enum('pricing_mode', ['net', 'vat_included'])
                ->default('net')
                ->after('vat_percentage')
                ->comment('โหมดการคำนวณราคา: net = ราคาไม่รวมภาษี, vat_included = ราคารวมภาษี');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['net_subtotal', 'pricing_mode']);
        });
    }
};
