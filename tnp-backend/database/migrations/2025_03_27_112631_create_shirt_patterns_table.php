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
        Schema::create('shirt_patterns', function (Blueprint $table) {
            $table->bigIncrements('pattern_id');
            $table->char('pattern_name', 100);
            $table->integer('shirt_category')->comment('1=t-shirt, 2=polo shirt');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shirt_patterns');
    }
};
