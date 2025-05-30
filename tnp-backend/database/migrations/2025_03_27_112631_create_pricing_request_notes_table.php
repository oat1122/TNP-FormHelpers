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
        Schema::create('pricing_request_notes', function (Blueprint $table) {
            $table->comment('ตารางบันทึกคำขอราคา');
            $table->char('prn_id', 36)->default('uuid()')->primary();
            $table->char('prn_pr_id', 36)->nullable()->comment('ไอดีตาราง pricing_requests');
            $table->text('prn_text')->nullable()->comment('ข้อความ');
            $table->tinyInteger('prn_note_type')->nullable()->comment('1=sale, 2=price, 3=manager');
            $table->boolean('prn_is_deleted')->nullable()->default(false)->comment('สถานะการลบ');
            $table->timestamp('prn_created_date')->nullable()->useCurrent()->comment('วันที่สร้างข้อมูล');
            $table->char('prn_created_by', 36)->nullable()->comment('คนสร้างข้อมูล');
            $table->timestamp('prn_updated_date')->useCurrentOnUpdate()->nullable()->useCurrent()->comment('วันที่อัปเดตข้อมูล');
            $table->char('prn_updated_by', 36)->nullable()->comment('คนอัปเดตข้อมูล');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pricing_request_notes');
    }
};
