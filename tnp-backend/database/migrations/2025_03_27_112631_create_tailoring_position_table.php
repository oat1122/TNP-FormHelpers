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
        Schema::create('tailoring_position', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('work_id', 15);
            $table->set('position', ['ปักบนกระเป๋า', 'ปักเหนือกระเป๋า', 'ปักอกซ้าย', 'ปักอกขวา', 'ปักแขนซ้าย', 'ปักแขนขวา', 'ปักหลัง']);
            $table->text('position_size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tailoring_position');
    }
};
