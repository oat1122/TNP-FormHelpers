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
        Schema::create('example_quantity', function (Blueprint $table) {
            $table->integer('ex_id', true);
            $table->string('work_id', 15)->index('work_id');
            $table->integer('ex_sss');
            $table->integer('ex_ss');
            $table->integer('ex_s');
            $table->integer('ex_m');
            $table->integer('ex_l');
            $table->integer('ex_xl');
            $table->integer('ex_2xl');
            $table->integer('ex_3xl');
            $table->integer('ex_4xl');
            $table->integer('ex_5xl');
            $table->integer('ex_6xl');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('example_quantity');
    }
};
