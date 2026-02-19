<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create supplier_product_categories table
        Schema::create('supplier_product_categories', function (Blueprint $table) {
            $table->comment('หมวดหมู่สินค้า Supplier (แยกจาก Master Product Categories)');
            $table->char('spc_id', 36)->primary();
            $table->string('spc_name', 255)->comment('ชื่อหมวดหมู่');
            $table->string('spc_sku_prefix', 10)->comment('Prefix สำหรับรัน SKU เช่น TNP');
            $table->text('spc_remark')->nullable()->comment('หมายเหตุ');
            $table->boolean('spc_is_deleted')->default(false);
            $table->timestamps();
            
            $table->unique('spc_name', 'idx_spc_name');
            $table->unique('spc_sku_prefix', 'idx_spc_sku_prefix');
        });

        // Set default uuid() for spc_id
        DB::statement("ALTER TABLE `supplier_product_categories` CHANGE `spc_id` `spc_id` CHAR(36) NOT NULL DEFAULT uuid()");

        // 2. Add sp_spc_id to supplier_products table
        Schema::table('supplier_products', function (Blueprint $table) {
            $table->char('sp_spc_id', 36)->nullable()->after('sp_mpc_id')->comment('FK: supplier_product_categories.spc_id');
            $table->index('sp_spc_id', 'idx_sp_spc_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supplier_products', function (Blueprint $table) {
            $table->dropColumn('sp_spc_id');
        });

        Schema::dropIfExists('supplier_product_categories');
    }
};
