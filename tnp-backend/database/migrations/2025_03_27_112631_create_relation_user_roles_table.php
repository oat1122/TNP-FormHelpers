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
        Schema::create('relation_user_roles', function (Blueprint $table) {
            $table->comment('relation ระหว่าง users กับ roles');
            $table->char('rur_id', 36)->default('uuid()')->primary()->comment('ไอดีตาราง relation_user_roles');
            $table->char('rur_user_id', 36)->nullable()->comment('ไอดีตาราง users');
            $table->char('rur_role_id', 36)->nullable()->comment('ไอดีตาราง roles');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('relation_user_roles');
    }
};
