<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('max_supply_id');
            $table->char('user_id', 36);
            $table->string('action', 50)->comment('created, updated, status_changed, deleted');
            $table->text('description')->comment('คำอธิบายกิจกรรม');
            $table->json('old_values')->nullable()->comment('ค่าเดิม');
            $table->json('new_values')->nullable()->comment('ค่าใหม่');
            $table->timestamps();

            // Indexes
            $table->index('max_supply_id');
            $table->index('user_id');
            $table->index('action');
        });
        
        // เพิ่ม Foreign Key Constraints แยกออกมา
        if (Schema::hasTable('max_supplies')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->foreign('max_supply_id')
                      ->references('id')
                      ->on('max_supplies')
                      ->onDelete('cascade');
            });
        }

        // เพิ่ม Foreign Key สำหรับ users ก็ต่อเมื่อ table มีอยู่
        if (Schema::hasTable('users')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->foreign('user_id')
                      ->references('user_id')
                      ->on('users')
                      ->onDelete('restrict');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
