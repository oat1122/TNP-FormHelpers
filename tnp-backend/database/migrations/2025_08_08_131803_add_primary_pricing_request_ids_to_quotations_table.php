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
            // เพิ่ม field primary_pricing_request_ids เป็น JSON array
            $table->json('primary_pricing_request_ids')->nullable()
                  ->after('primary_pricing_request_id')
                  ->comment('Array ของ Pricing Request IDs ที่ใช้สำหรับ autofill (supports multiple)');
        });
        
        // Migration ข้อมูลเก่า: แปลง single ID เป็น array
        \DB::statement("
            UPDATE quotations 
            SET primary_pricing_request_ids = CASE 
                WHEN primary_pricing_request_id IS NOT NULL THEN 
                    JSON_ARRAY(primary_pricing_request_id)
                ELSE 
                    NULL 
            END
            WHERE primary_pricing_request_id IS NOT NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn('primary_pricing_request_ids');
        });
    }
};
