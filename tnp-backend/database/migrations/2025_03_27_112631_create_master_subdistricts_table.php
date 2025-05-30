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
        Schema::create('master_subdistricts', function (Blueprint $table) {
            $table->comment('ตารางตำบล');
            $table->char('sub_id', 36)->default('uuid()')->primary();
            $table->string('sub_name_th', 50)->nullable()->comment('ชื่อตำบล ภาษาไทย');
            $table->string('sub_name_en', 50)->nullable()->comment('ชื่อตำบล ภาษาอังกฤษ');
            $table->integer('sub_sort_id')->nullable()->comment('เลข id ใช้สำหรับ sort');
            $table->integer('sub_dis_sort_id')->nullable()->comment('sort id ของ districts');
            $table->char('sub_zip_code', 5)->nullable()->comment('รหัสไปรษณีย์');
            $table->boolean('sub_is_use')->default(true)->comment('สถานะการใช้งาน');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_subdistricts');
    }
};
