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
            // ลบฟิลด์ pricing_request_id เก่าออก (ที่เก็บเป็น JSON)
            $table->dropColumn('pricing_request_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            // เพิ่มฟิลด์กลับมาถ้า rollback
            $table->char('pricing_request_id', 36)->nullable()
                  ->after('primary_pricing_request_id')
                  ->comment('อ้างอิงถึง pricing_requests.pr_id (DEPRECATED)');
        });
    }
};
