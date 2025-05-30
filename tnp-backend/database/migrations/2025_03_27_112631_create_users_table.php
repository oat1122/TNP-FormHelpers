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
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('user_id');
            $table->char('user_uuid', 36)->default('uuid()')->comment('ไอดีตาราง users ใหม่');
            $table->string('username');
            $table->string('password');
            $table->enum('role', ['admin', 'manager', 'production', 'graphic', 'sale', 'technician']);
            $table->string('user_emp_no', 20)->nullable()->comment('รหัสพนักงาน');
            $table->string('user_firstname', 50)->nullable()->comment('ชื่อ');
            $table->string('user_lastname', 50)->nullable()->comment('นามสกุล');
            $table->string('user_phone', 50)->nullable()->comment('เบอร์โทรศัพท์');
            $table->string('user_nickname', 50)->nullable()->comment('ชื่อเล่น');
            $table->string('user_position', 100)->nullable()->comment('ตำแหน่ง');
            $table->enum('enable', ['Y', 'N'])->default('Y');
            $table->boolean('user_is_enable')->default(true)->comment('สถานะการใช้งาน');
            $table->integer('deleted')->default(0)->comment('1=deleted');
            $table->boolean('user_is_deleted')->default(false)->comment('สถานะการลบ');
            $table->timestamps();
            $table->string('new_pass')->nullable()->comment('รหัสผ่านใหม่');
            $table->boolean('pass_is_updated')->nullable()->default(false);
            $table->timestamp('user_created_date')->nullable()->useCurrent()->comment('วันที่สร้างข้อมูล');
            $table->bigInteger('user_created_by')->nullable()->comment('คนสร้างข้อมูล');
            $table->timestamp('user_updated_date')->useCurrentOnUpdate()->nullable()->useCurrent()->comment('วันที่อัปเดตข้อมูล');
            $table->bigInteger('user_updated_by')->nullable()->comment('คนอัปเดตข้อมูล');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
