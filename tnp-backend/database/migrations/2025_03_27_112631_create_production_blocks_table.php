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
        Schema::create('production_blocks', function (Blueprint $table) {
            $table->bigIncrements('block_id');
            $table->unsignedBigInteger('pd_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->integer('embroid_factory')->nullable();
            $table->enum('screen_block', ['IN', 'OUT', 'EDIT'])->nullable();
            $table->enum('dft_block', ['IN', 'OUT', 'EDIT'])->nullable();
            $table->date('embroid_date')->nullable();
            $table->date('screen_date')->nullable();
            $table->date('dft_date')->nullable();
            $table->timestamp('created_at')->useCurrentOnUpdate()->nullable()->useCurrent();
            $table->timestamp('updated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_blocks');
    }
};
