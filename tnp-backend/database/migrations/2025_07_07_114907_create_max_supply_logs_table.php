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
        Schema::create('max_supply_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('max_supply_id'); // เชื่อมกับ max_supplies
            $table->string('action'); // การกระทำ (created, updated, deleted, status_changed)
            $table->json('old_data')->nullable(); // ข้อมูลเก่า
            $table->json('new_data')->nullable(); // ข้อมูลใหม่
            $table->text('description')->nullable(); // คำอธิบายการเปลี่ยนแปลง
            $table->unsignedBigInteger('user_id'); // ผู้ทำการเปลี่ยนแปลง
            $table->string('ip_address')->nullable(); // IP address
            $table->string('user_agent')->nullable(); // User agent
            $table->timestamps();
            
            // Indexes
            $table->index(['max_supply_id', 'created_at']);
            $table->index(['user_id', 'action']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('max_supply_logs');
    }
};
