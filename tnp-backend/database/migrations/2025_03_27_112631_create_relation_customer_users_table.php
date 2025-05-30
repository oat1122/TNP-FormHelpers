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
        Schema::create('relation_customer_users', function (Blueprint $table) {
            $table->char('rcs_id', 36)->default('uuid()')->primary();
            $table->char('rcs_cus_id', 36)->nullable()->comment('ไอดีตาราง master_customers');
            $table->bigInteger('rcs_user_id')->nullable()->comment('ไอดีตาราง users');
            $table->boolean('rcs_is_use')->default(true)->comment('สถานะการใช้งาน');
            $table->timestamp('rcs_created_date')->nullable()->useCurrent()->comment('วันที่สร้างข้อมูล');
            $table->timestamp('rcs_updated_date')->useCurrentOnUpdate()->nullable()->useCurrent()->comment('วันที่อัปเดตข้อมูล');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('relation_customer_users');
    }
};
