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
        Schema::create('new_worksheet_screens', function (Blueprint $table) {
            $table->char('screen_id', 36)->primary()->comment('ไอดีตาราง 24ws_worksheet_screens');
            $table->integer('screen_point')->nullable();
            $table->integer('screen_dft')->nullable();
            $table->integer('screen_flex')->nullable();
            $table->integer('screen_label')->nullable();
            $table->integer('screen_embroider')->nullable();
            $table->text('screen_detail')->nullable()->comment('รายละเอียดลายสกรีน');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('new_worksheet_screens');
    }
};
