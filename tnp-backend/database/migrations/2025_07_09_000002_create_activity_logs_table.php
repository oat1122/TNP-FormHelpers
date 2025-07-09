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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('max_supply_id')->constrained()->onDelete('cascade');
            $table->char('user_id', 36)->nullable()->comment('ผู้ทำรายการ');
            $table->string('action', 50)->comment('การกระทำ เช่น created, updated, status_changed, deleted');
            $table->string('description')->comment('คำอธิบาย');
            $table->json('old_values')->nullable()->comment('ค่าเดิมก่อนแก้ไข');
            $table->json('new_values')->nullable()->comment('ค่าใหม่หลังแก้ไข');
            $table->timestamps();
            
            $table->index('max_supply_id');
            $table->index('user_id');
            $table->index('action');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
