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
            // เพิ่มฟิลด์ inv_manage_by หลัง created_by
            $table->char('inv_manage_by', 36)->nullable()
                  ->after('created_by')
                  ->comment('ผู้จัดการใบแจ้งหนี้ - อ้างอิงถึง users.user_uuid');
            
            // เพิ่ม index สำหรับ inv_manage_by
            $table->index('inv_manage_by', 'idx_invoices_inv_manage_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // ลบ index ก่อน
            $table->dropIndex('idx_invoices_inv_manage_by');
            // ลบฟิลด์ inv_manage_by
            $table->dropColumn('inv_manage_by');
        });
    }
};
