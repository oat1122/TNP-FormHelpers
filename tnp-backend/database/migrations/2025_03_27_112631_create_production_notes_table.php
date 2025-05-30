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
        Schema::create('production_notes', function (Blueprint $table) {
            $table->bigIncrements('note_id');
            $table->bigInteger('pd_id');
            $table->bigInteger('user_id');
            $table->char('note_category', 50)->nullable();
            $table->text('note_descr')->nullable();
            $table->timestamp('note_datetime')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_notes');
    }
};
