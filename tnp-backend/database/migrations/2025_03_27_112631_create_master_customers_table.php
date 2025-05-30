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
        Schema::create('master_customers', function (Blueprint $table) {
            $table->char('cus_id', 36)->default('uuid()')->primary();
            $table->char('cus_mcg_id', 36)->nullable()->comment('ไอดีตารางกลุ่ม customer');
            $table->char('cus_no', 10)->nullable()->comment('รหัสลูกค้า');
            $table->tinyInteger('cus_channel')->nullable()->comment('1=sales, 2=online, 3=office');
            $table->string('cus_firstname', 100)->nullable()->comment('ชื่อลูกค้า');
            $table->string('cus_lastname', 100)->nullable()->comment('นามสกุลลูกค้า');
            $table->string('cus_name', 100)->nullable()->comment('ชื่อเล่น');
            $table->string('cus_depart', 100)->nullable()->comment('ตำแหน่งหรือแผนก');
            $table->string('cus_company')->nullable()->comment('ชื่อบริษัท');
            $table->char('cus_tel_1', 20)->nullable()->comment('เบอร์โทรหลัก');
            $table->char('cus_tel_2', 20)->nullable()->comment('เบอร์โทรสำรอง');
            $table->string('cus_email', 100)->nullable()->comment('อีเมลล์');
            $table->char('cus_tax_id', 13)->nullable()->comment('เลขประจำตัวผู้เสียภาษี');
            $table->char('cus_pro_id', 36)->nullable()->comment('ไอดีตาราง provinces');
            $table->char('cus_dis_id', 36)->nullable()->comment('ไอดีตาราง district');
            $table->char('cus_sub_id', 36)->nullable()->comment('ไอดีตาราง subdistrict');
            $table->char('cus_zip_code', 5)->nullable()->comment('รหัสไปรษณีย์');
            $table->text('cus_address')->nullable()->comment('รายละเอียดที่อยู่');
            $table->bigInteger('cus_manage_by')->nullable()->comment('คนดูแล');
            $table->boolean('cus_is_use')->default(true)->comment('สถานะการใช้งาน');
            $table->timestamp('cus_created_date')->nullable()->useCurrent()->comment('วันที่สร้างข้อมูล');
            $table->bigInteger('cus_created_by')->nullable()->comment('คนสร้างข้อมูล');
            $table->timestamp('cus_updated_date')->useCurrentOnUpdate()->nullable()->useCurrent()->comment('วันที่อัปเดตข้อมูล');
            $table->bigInteger('cus_updated_by')->nullable()->comment('คนอัปเดตข้อมูล');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_customers');
    }
};
