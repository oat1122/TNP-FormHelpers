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
        Schema::create('new_worksheet_polo_embroiders', function (Blueprint $table) {
            $table->char('polo_embroider_id', 36)->primary()->comment('ไอดีตาราง 24ws_worksheet_polo_embroiders');
            $table->char('polo_detail_id', 36)->nullable()->comment('ไอดีตาราง 24ws_worksheet_polo_details');
            $table->tinyInteger('embroider_position')->nullable()->comment('1=ปักบนกระเป๋า, 2=ปักเหนือกระเป๋า, 3=ปักอกซ้าย, 4=ปักอกขวา, 5=ปักแขนซ้าย, 6=ปักแขนขวา, 7=ปักหลัง');
            $table->text('embroider_size')->nullable()->comment('ขนาดลายปัก');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('new_worksheet_polo_embroiders');
    }
};
