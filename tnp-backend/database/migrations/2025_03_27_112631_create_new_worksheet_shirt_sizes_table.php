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
        Schema::create('new_worksheet_shirt_sizes', function (Blueprint $table) {
            $table->char('shirt_size_id', 36)->primary()->comment('ไอดีตาราง 24ws_worksheet_shirt_sizes');
            $table->char('pattern_id', 36)->nullable()->comment('ไอดีตาราง 24ws_worksheet_shirt_patterns');
            $table->tinyInteger('shirt_pattern_type')->nullable()->comment('1=unisex, 2=men, 3=women');
            $table->string('size_name', 10)->nullable()->comment('ชื่อไซซ์');
            $table->double('chest', 8, 2)->nullable()->comment('รอบอก');
            $table->double('long', 8, 2)->nullable()->comment('ความยาว');
            $table->integer('quantity')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('new_worksheet_shirt_sizes');
    }
};
