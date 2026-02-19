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
        Schema::create('supplier_product_options', function (Blueprint $table) {
            $table->uuid('spo_id')->primary();
            $table->uuid('spo_sp_id')->index();
            $table->string('spo_name');
            $table->boolean('spo_is_active')->default(true);
            $table->timestamps();

            $table->foreign('spo_sp_id')->references('sp_id')->on('supplier_products')->onDelete('cascade');
        });

        Schema::create('supplier_product_option_tiers', function (Blueprint $table) {
            $table->uuid('spot_id')->primary();
            $table->uuid('spot_spo_id')->index();
            $table->integer('spot_min_qty');
            $table->integer('spot_max_qty')->nullable();
            $table->decimal('spot_price', 10, 2);
            $table->timestamps();

            $table->foreign('spot_spo_id')->references('spo_id')->on('supplier_product_options')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_product_option_tiers');
        Schema::dropIfExists('supplier_product_options');
    }
};
