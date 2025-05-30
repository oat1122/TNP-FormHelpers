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
        Schema::create('master_districts', function (Blueprint $table) {
            $table->comment('ตารางอำเภอ');
            $table->char('dis_id', 36)->default('uuid()')->primary();
            $table->string('dis_name_th', 50)->nullable()->comment('ชื่ออำเภอ ภาษาไทย');
            $table->string('dis_name_en', 50)->nullable()->comment('ชื่ออำเภอ ภาษาอังกฤษ');
            $table->integer('dis_sort_id')->nullable()->comment('เลข id ใช้สำหรับ sort');
            $table->integer('dis_pro_sort_id')->nullable()->comment('sort id ของ provices');
            $table->boolean('dis_is_use')->default(true)->comment('สถานะการใช้งาน');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_districts');
    }
};
