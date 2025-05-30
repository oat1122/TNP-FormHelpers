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
        Schema::create('master_roles', function (Blueprint $table) {
            $table->comment('ตารางแผนก');
            $table->char('role_id', 36)->default('uuid()')->primary()->comment('ไอดีตาราง roles');
            $table->string('role_name', 50)->nullable()->comment('ชื่อแผนก');
            $table->text('role_remark')->nullable()->comment('รายละเอียดแผนก');
            $table->boolean('role_is_deleted')->nullable()->default(false)->comment('สถานะการลบ');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_roles');
    }
};
