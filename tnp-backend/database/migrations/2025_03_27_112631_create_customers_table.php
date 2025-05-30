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
        Schema::create('customers', function (Blueprint $table) {
            $table->char('customer_id', 36)->primary()->comment('ไอดีตาราง customers');
            $table->string('customer_name', 100)->nullable()->default('');
            $table->string('company_name')->nullable()->default('');
            $table->text('customer_address')->nullable()->default('');
            $table->string('customer_tel', 20)->nullable()->default('');
            $table->string('customer_email', 100)->nullable()->default('');
            $table->integer('customer_tax_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
