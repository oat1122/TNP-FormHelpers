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
        Schema::table('quotations', function (Blueprint $table) {
            // เพิ่มฟิลด์สำหรับส่วนลดพิเศษ
            $table->decimal('special_discount_percentage', 5, 2)->default(0.00)->after('tax_amount')
                  ->comment('ส่วนลดพิเศษ %');
            $table->decimal('special_discount_amount', 15, 2)->default(0.00)->after('special_discount_percentage')
                  ->comment('จำนวนเงินส่วนลดพิเศษ');
            
            // เพิ่มฟิลด์สำหรับหักภาษี ณ ที่จ่าย
            $table->boolean('has_withholding_tax')->default(false)->after('special_discount_amount')
                  ->comment('มีหักภาษี ณ ที่จ่าย');
            $table->decimal('withholding_tax_percentage', 5, 2)->default(0.00)->after('has_withholding_tax')
                  ->comment('เปอร์เซ็นต์ภาษีหัก ณ ที่จ่าย');
            $table->decimal('withholding_tax_amount', 15, 2)->default(0.00)->after('withholding_tax_percentage')
                  ->comment('จำนวนภาษีหัก ณ ที่จ่าย');
            
            // เพิ่มฟิลด์สำหรับยอดสุทธิหลังหักส่วนลดพิเศษและภาษี ณ ที่จ่าย
            $table->decimal('final_total_amount', 15, 2)->default(0.00)->after('withholding_tax_amount')
                  ->comment('ยอดสุทธิสุดท้าย (หลังหักส่วนลดพิเศษและภาษี ณ ที่จ่าย)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn([
                'special_discount_percentage',
                'special_discount_amount',
                'has_withholding_tax',
                'withholding_tax_percentage',
                'withholding_tax_amount',
                'final_total_amount'
            ]);
        });
    }
};
