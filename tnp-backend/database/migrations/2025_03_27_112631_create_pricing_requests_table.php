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
        Schema::create('pricing_requests', function (Blueprint $table) {
            $table->comment('ตารางคำขอราคา');
            $table->char('pr_id', 36)->default('uuid()')->primary();
            $table->char('pr_cus_id', 36)->nullable()->comment('ไอดีตาราง customers');
            $table->char('pr_mpc_id', 36)->nullable()->comment('ไอดีตารางประเภทสินค้า');
            $table->char('pr_status_id', 36)->nullable()->comment('ไอดีตารางสถานะ');
            $table->string('pr_no', 20)->nullable()->comment('รหัสคำขอราคา');
            $table->string('pr_work_name', 100)->nullable()->comment('ชื่องาน');
            $table->string('pr_pattern')->nullable()->comment('แพทเทิร์น');
            $table->string('pr_fabric_type')->nullable()->comment('ชนิดผ้า');
            $table->string('pr_color')->nullable()->comment('สีสินค้า');
            $table->string('pr_sizes')->nullable()->comment('ไซซ์');
            $table->string('pr_quantity', 10)->nullable()->comment('จำนวน');
            $table->dateTime('pr_due_date')->nullable()->comment('วันที่ส่ง');
            $table->string('pr_silk')->nullable()->comment('silk screen');
            $table->string('pr_dft')->nullable()->comment('dft screen');
            $table->string('pr_embroider')->nullable()->comment('การปัก');
            $table->string('pr_sub')->nullable()->comment('sublimation screen');
            $table->string('pr_other_screen')->nullable()->comment('การสกรีนแบบอื่นๆ');
            $table->string('pr_image')->nullable()->comment('รูปสินค้า');
            $table->boolean('pr_is_deleted')->default(false)->comment('สถานะการลบ');
            $table->timestamp('pr_created_date')->nullable()->useCurrent()->comment('วันที่สร้างข้อมูล');
            $table->char('pr_created_by', 36)->nullable()->comment('คนสร้างข้อมูล');
            $table->timestamp('pr_updated_date')->useCurrentOnUpdate()->nullable()->useCurrent()->comment('วันที่อัปเดตข้อมูล');
            $table->char('pr_updated_by', 36)->nullable()->comment('คนอัปเดตข้อมูล');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pricing_requests');
    }
};
