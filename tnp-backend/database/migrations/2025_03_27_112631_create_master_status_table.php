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
        Schema::create('master_status', function (Blueprint $table) {
            $table->comment('ตารางสถานะ');
            $table->char('status_id', 36)->default('uuid()')->primary();
            $table->string('status_name', 100)->nullable()->comment('ชื่อสถานะ');
            $table->text('status_remark')->nullable()->comment('รายละเอียดสถานะ');
            $table->tinyInteger('status_type')->nullable()->comment('1=คำขอราคา');
            $table->boolean('status_is_deleted')->default(false)->comment('สถานะการลบ');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_status');
    }
};
