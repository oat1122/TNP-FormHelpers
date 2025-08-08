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
            // เพิ่มฟิลด์ใหม่สำหรับ primary pricing request (ใช้สำหรับ autofill หลัก)
            $table->char('primary_pricing_request_id', 36)->nullable()
                  ->after('customer_id')
                  ->comment('Pricing Request หลักที่ใช้สำหรับ autofill ข้อมูล');
            
            // เพิ่ม index
            $table->index('primary_pricing_request_id', 'idx_quotations_primary_pricing_request');
        });
        
        // Migration ข้อมูลเก่า: แปลง JSON array เป็น primary_pricing_request_id
        \DB::statement("
            UPDATE quotations 
            SET primary_pricing_request_id = CASE 
                WHEN pricing_request_id LIKE '[%' THEN 
                    JSON_UNQUOTE(JSON_EXTRACT(pricing_request_id, '$[0]'))
                ELSE 
                    pricing_request_id 
            END
            WHERE pricing_request_id IS NOT NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropIndex('idx_quotations_primary_pricing_request');
            $table->dropColumn('primary_pricing_request_id');
        });
    }
};
