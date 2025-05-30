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
        Schema::create('worksheets_confirm', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('work_id', 15)->index('work_id');
            $table->integer('sale');
            $table->integer('graphic');
            $table->integer('manager');
            $table->dateTime('sale_date');
            $table->dateTime('graphic_date');
            $table->dateTime('manager_date');
            $table->dateTime('sale_edit_date')->nullable();
            $table->dateTime('graphic_edit_date')->nullable();
            $table->dateTime('manager_edit_date')->nullable();
            $table->dateTime('sale_access_date')->nullable();
            $table->dateTime('graphic_access_date')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('worksheets_confirm');
    }
};
