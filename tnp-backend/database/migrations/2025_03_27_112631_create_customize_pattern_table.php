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
        Schema::create('customize_pattern', function (Blueprint $table) {
            $table->integer('pattern_id', true);
            $table->string('work_id', 15)->index('work_id');
            $table->string('pattern_name', 100);
            $table->float('chest_sss', null, 0);
            $table->float('long_sss', null, 0);
            $table->float('chest_ss', null, 0);
            $table->float('long_ss', null, 0);
            $table->float('chest_s', null, 0);
            $table->float('long_s', null, 0);
            $table->float('chest_m', null, 0);
            $table->float('long_m', null, 0);
            $table->float('chest_l', null, 0);
            $table->float('long_l', null, 0);
            $table->float('chest_xl', null, 0);
            $table->float('long_xl', null, 0);
            $table->float('chest_2xl', null, 0);
            $table->float('long_2xl', null, 0);
            $table->float('chest_3xl', null, 0);
            $table->float('long_3xl', null, 0);
            $table->float('chest_4xl', null, 0);
            $table->float('long_4xl', null, 0);
            $table->float('chest_5xl', null, 0);
            $table->float('long_5xl', null, 0);
            $table->float('chest_6xl', null, 0);
            $table->float('long_6xl', null, 0);
            $table->float('chest_7xl', null, 0);
            $table->float('long_7xl', null, 0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customize_pattern');
    }
};
