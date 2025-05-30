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
        Schema::create('master_provices', function (Blueprint $table) {
            $table->comment('ตารางจังหวัด');
            $table->char('pro_id', 36)->default('uuid()')->primary();
            $table->string('pro_name_th', 50)->nullable()->comment('ชื่อจังหวัด ภาษาไทย');
            $table->string('pro_name_en', 50)->nullable()->comment('ชื่อจังหวัด ภาษาอังกฤษ');
            $table->integer('pro_sort_id')->nullable()->comment('เลข id ใช้สำหรับ sort');
            $table->integer('pro_geo_sort_id')->nullable()->comment('sort id ของ geographies');
            $table->boolean('pro_is_use')->default(true)->comment('สถานะการใช้งาน');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_provices');
    }
};
