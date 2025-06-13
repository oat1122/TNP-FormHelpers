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
        Schema::create('master_business_types', function (Blueprint $table) {
            $table->char('bt_id', 36)->default('uuid()')->primary();
            $table->string('bt_name')->nullable()->comment('ชื่อประเภทธุรกิจ');
            $table->integer('bt_sort')->nullable()->comment('เรียงลำดับ');
            $table->boolean('bt_is_use')->default(true)->comment('สถานะการใช้งาน');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_business_types');
    }
};
