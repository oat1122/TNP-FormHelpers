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
        Schema::create('customer', function (Blueprint $table) {
            $table->integer('customer_id', true);
            $table->string('work_id', 15)->index('work_id');
            $table->integer('user_id')->index('user_id');
            $table->string('customer_name', 100);
            $table->text('customer_address')->nullable();
            $table->string('customer_tel', 20)->nullable();
            $table->string('customer_email', 100)->nullable();
            $table->integer('customer_taxid')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer');
    }
};
