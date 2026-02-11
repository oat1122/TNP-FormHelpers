<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('master_product_categories', function (Blueprint $table) {
            $table->string('mpc_sku_prefix', 10)
                ->nullable()
                ->after('mpc_name')
                ->comment('SKU prefix สำหรับ auto generate SKU เช่น FAB, ACC, THR');
        });
    }

    public function down(): void
    {
        Schema::table('master_product_categories', function (Blueprint $table) {
            $table->dropColumn('mpc_sku_prefix');
        });
    }
};
