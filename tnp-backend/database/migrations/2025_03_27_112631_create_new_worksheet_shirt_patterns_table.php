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
        Schema::create('new_worksheet_shirt_patterns', function (Blueprint $table) {
            $table->char('pattern_id', 36)->primary()->comment('ไอดีตาราง 24ws_worksheet_shirt_patterns');
            $table->string('display_pattern_id', 50)->nullable()->comment('ไอดีแพทเทิร์นเสื้อสำหรับแสดงผล');
            $table->string('pattern_name', 100)->nullable()->comment('ชื่อแพทเทิร์นเสื้อ');
            $table->tinyInteger('pattern_type')->nullable()->comment('1=unisex, 2=men/women');
            $table->enum('enable_edit', ['Y', 'N'])->default('Y')->comment('สถานะการใช้งาน');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('new_worksheet_shirt_patterns');
    }
};
