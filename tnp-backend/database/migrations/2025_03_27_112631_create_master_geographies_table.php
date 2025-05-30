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
        Schema::create('master_geographies', function (Blueprint $table) {
            $table->comment('ตารางภาค');
            $table->char('geo_id', 36)->default('uuid()')->primary();
            $table->string('geo_name', 50)->nullable()->comment('ชื่อภาค');
            $table->integer('geo_sort_id')->nullable()->comment('เลข id ใช้สำหรับ sort');
            $table->boolean('geo_is_use')->default(true)->comment('สถานะการใช้งาน');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_geographies');
    }
};
