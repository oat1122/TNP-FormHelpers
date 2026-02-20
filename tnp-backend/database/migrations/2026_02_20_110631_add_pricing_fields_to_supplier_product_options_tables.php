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
        Schema::table('supplier_product_options', function (Blueprint $table) {
            $table->decimal('spo_base_price', 10, 2)->nullable()->after('spo_is_active');
            $table->string('spo_scale_mode', 20)->nullable()->after('spo_base_price')->comment("percent or fixed");
        });

        Schema::table('supplier_product_option_tiers', function (Blueprint $table) {
            $table->decimal('spot_discount', 10, 2)->nullable()->after('spot_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supplier_product_option_tiers', function (Blueprint $table) {
            $table->dropColumn('spot_discount');
        });

        Schema::table('supplier_product_options', function (Blueprint $table) {
            $table->dropColumn(['spo_base_price', 'spo_scale_mode']);
        });
    }
};
