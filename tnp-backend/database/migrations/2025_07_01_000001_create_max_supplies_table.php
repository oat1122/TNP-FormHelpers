<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('max_supplies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('worksheet_id')->nullable();
            $table->string('title');
            $table->string('status')->default('draft');
            $table->date('due_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('max_supplies');
    }
};
