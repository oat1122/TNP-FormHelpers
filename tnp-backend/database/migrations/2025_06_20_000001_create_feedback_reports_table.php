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
        Schema::create('feedback_reports', function (Blueprint $table) {
            $table->comment('ตารางรายงานข้อเสนอแนะ/ข้อร้องเรียน');
            $table->char('fr_id', 36)->default('uuid()')->primary();
            $table->text('fr_content')->nullable()->comment('เนื้อหาข้อความรายงาน');
            $table->char('fr_category', 36)->nullable()->comment('หมวดหมู่ของรายงาน');
            $table->integer('fr_priority')->default(1)->comment('ความเร่งด่วน (1-ต่ำ, 2-กลาง, 3-สูง)');
            $table->boolean('fr_resolved')->default(false)->comment('สถานะการแก้ไข');
            $table->boolean('fr_is_anonymous')->default(true)->comment('รายงานโดยไม่ระบุตัวตน');
            $table->string('fr_image', 255)->nullable()->comment('รูปภาพประกอบ (ถ้ามี)');
            $table->boolean('fr_is_deleted')->default(false)->comment('สถานะการลบ');
            $table->dateTime('fr_created_date')->nullable()->comment('วันที่สร้าง');
            $table->char('fr_created_by', 36)->nullable()->comment('ผู้สร้าง');
            $table->dateTime('fr_updated_date')->nullable()->comment('วันที่แก้ไข');
            $table->char('fr_updated_by', 36)->nullable()->comment('ผู้แก้ไข');
            $table->text('fr_admin_response')->nullable()->comment('คำตอบจากผู้ดูแลระบบ');
            $table->dateTime('fr_response_date')->nullable()->comment('วันที่ตอบกลับ');
            $table->char('fr_response_by', 36)->nullable()->comment('ผู้ตอบกลับ');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedback_reports');
    }
};
