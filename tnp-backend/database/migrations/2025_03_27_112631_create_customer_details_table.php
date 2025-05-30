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
        Schema::create('customer_details', function (Blueprint $table) {
            $table->char('cd_id', 36)->default('uuid()')->primary();
            $table->char('cd_cus_id', 36)->nullable()->comment('ไอดีตาราง master_customers');
            $table->dateTime('cd_last_datetime')->nullable()->comment('วันที่สิ้นสุด');
            $table->string('cd_note')->nullable()->comment('ข้อความสั้นๆ');
            $table->text('cd_remark')->nullable()->comment('หมายเหตุ');
            $table->boolean('cd_is_use')->default(true)->comment('สถานะการใช้งาน');
            $table->timestamp('cd_created_date')->nullable()->useCurrent()->comment('วันที่สร้างข้อมูล');
            $table->bigInteger('cd_created_by')->nullable()->comment('คนสร้างข้อมูล');
            $table->timestamp('cd_updated_date')->useCurrentOnUpdate()->nullable()->useCurrent()->comment('วันที่อัปเดตข้อมูล');
            $table->bigInteger('cd_updated_by')->nullable()->comment('คนอัปเดตข้อมูล');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_details');
    }
};
