<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * เพิ่ม fields สำหรับรองรับการคำนวณราคาแบบ VAT-Included และ Net Price
     * - has_vat: เปิด/ปิดการคิด VAT
     * - vat_percentage: เปอร์เซ็นต์ VAT (default 7%)
     * - pricing_mode: โหมดคำนวณราคา (net = ราคาสุทธิ + VAT, vat_included = ราคารวม VAT)
     */
    public function up(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            // เพิ่ม has_vat field
            $table->boolean('has_vat')
                ->default(true)
                ->after('final_total_amount')
                ->comment('เปิด/ปิดการคิดภาษีมูลค่าเพิ่ม (VAT)');

            // เพิ่ม vat_percentage field
            $table->decimal('vat_percentage', 5, 2)
                ->default(7.00)
                ->after('has_vat')
                ->comment('เปอร์เซ็นต์ภาษีมูลค่าเพิ่ม (VAT)');

            // เพิ่ม pricing_mode field
            $table->enum('pricing_mode', ['net', 'vat_included'])
                ->default('net')
                ->after('vat_percentage')
                ->comment('โหมดการคำนวณราคา: net = ราคาสุทธิ + VAT, vat_included = ราคารวม VAT แล้ว');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn(['has_vat', 'vat_percentage', 'pricing_mode']);
        });
    }
};
