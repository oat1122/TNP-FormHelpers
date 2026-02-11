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
        // 1. supplier_products
        Schema::create('supplier_products', function (Blueprint $table) {
            $table->comment('ตารางสินค้า Supplier');
            $table->char('sp_id', 36)->primary();
            $table->char('sp_mpc_id', 36)->nullable()->comment('FK: master_product_categories.mpc_id');
            $table->string('sp_name', 255)->comment('ชื่อสินค้า');
            $table->text('sp_description')->nullable()->comment('รายละเอียดสินค้า');
            $table->string('sp_sku', 100)->nullable()->comment('รหัสสินค้า');
            $table->string('sp_origin_country', 100)->nullable()->comment('ประเทศต้นทาง');
            $table->string('sp_supplier_name', 255)->nullable()->comment('ชื่อ Supplier');
            $table->text('sp_supplier_contact')->nullable()->comment('ข้อมูลติดต่อ Supplier');
            $table->decimal('sp_base_price', 12, 2)->default(0.00)->comment('ราคาพื้นฐานต่อหน่วย');
            $table->string('sp_currency', 10)->default('THB')->comment('สกุลเงินต้นทาง');
            $table->decimal('sp_price_thb', 12, 2)->nullable()->comment('ราคาแปลงเป็นบาท');
            $table->decimal('sp_exchange_rate', 12, 6)->nullable()->comment('อัตราแลกเปลี่ยน ณ เวลาที่บันทึก');
            $table->timestamp('sp_exchange_date')->nullable()->comment('วันที่ดึงอัตราแลกเปลี่ยน');
            $table->string('sp_unit', 50)->default('ชิ้น')->comment('หน่วยนับ');
            $table->string('sp_cover_image', 500)->nullable()->comment('path รูปปก');
            $table->boolean('sp_is_active')->default(true);
            $table->boolean('sp_is_deleted')->default(false);
            $table->char('sp_created_by', 36)->nullable()->comment('ref users.user_uuid');
            $table->char('sp_updated_by', 36)->nullable()->comment('ref users.user_uuid');
            $table->timestamps();

            $table->index('sp_mpc_id', 'idx_sp_mpc_id');
            $table->index('sp_is_active', 'idx_sp_is_active');
            $table->index('sp_currency', 'idx_sp_currency');
        });

        // Set default uuid() for sp_id
        DB::statement("ALTER TABLE `supplier_products` CHANGE `sp_id` `sp_id` CHAR(36) NOT NULL DEFAULT uuid()");

        // 2. supplier_product_images
        Schema::create('supplier_product_images', function (Blueprint $table) {
            $table->comment('รูปภาพสินค้า Supplier');
            $table->char('spi_id', 36)->primary();
            $table->char('spi_sp_id', 36)->comment('FK: supplier_products.sp_id');
            $table->string('spi_file_path', 500)->comment('path ไฟล์รูป');
            $table->string('spi_original_name', 255)->nullable()->comment('ชื่อไฟล์เดิม');
            $table->boolean('spi_is_cover')->default(false)->comment('เป็นรูปปกหรือไม่');
            $table->integer('spi_sort_order')->default(0)->comment('ลำดับการแสดงผล');
            $table->char('spi_uploaded_by', 36)->nullable()->comment('ref users.user_uuid');
            $table->timestamp('created_at')->nullable();

            $table->index('spi_sp_id', 'idx_spi_sp_id');
            $table->index('spi_is_cover', 'idx_spi_is_cover');
        });

        DB::statement("ALTER TABLE `supplier_product_images` CHANGE `spi_id` `spi_id` CHAR(36) NOT NULL DEFAULT uuid()");

        // 3. supplier_product_tags
        Schema::create('supplier_product_tags', function (Blueprint $table) {
            $table->comment('ตาราง Tags สินค้า');
            $table->char('spt_id', 36)->primary();
            $table->string('spt_name', 100)->comment('ชื่อ Tag');
            $table->boolean('spt_is_deleted')->default(false);
            $table->timestamps();

            $table->unique('spt_name', 'idx_spt_name');
        });

        DB::statement("ALTER TABLE `supplier_product_tags` CHANGE `spt_id` `spt_id` CHAR(36) NOT NULL DEFAULT uuid()");

        // 4. supplier_product_tag_relations (pivot)
        Schema::create('supplier_product_tag_relations', function (Blueprint $table) {
            $table->comment('Pivot สินค้า-Tags');
            $table->char('sptr_id', 36)->primary();
            $table->char('sptr_sp_id', 36)->comment('FK: supplier_products.sp_id');
            $table->char('sptr_spt_id', 36)->comment('FK: supplier_product_tags.spt_id');

            $table->unique(['sptr_sp_id', 'sptr_spt_id'], 'idx_sp_tag');
        });

        DB::statement("ALTER TABLE `supplier_product_tag_relations` CHANGE `sptr_id` `sptr_id` CHAR(36) NOT NULL DEFAULT uuid()");

        // 5. supplier_price_tiers
        Schema::create('supplier_price_tiers', function (Blueprint $table) {
            $table->comment('ตารางขั้นบันไดราคา (Price Scaling)');
            $table->char('sptier_id', 36)->primary();
            $table->char('sptier_sp_id', 36)->comment('FK: supplier_products.sp_id');
            $table->integer('sptier_min_qty')->comment('จำนวนขั้นต่ำ');
            $table->integer('sptier_max_qty')->nullable()->comment('จำนวนสูงสุด (NULL = ไม่จำกัด)');
            $table->decimal('sptier_price', 12, 2)->comment('ราคาต่อหน่วยในขั้นนี้');
            $table->boolean('sptier_is_auto')->default(true)->comment('1=คำนวณจาก formula, 0=แก้ไขมือ');
            $table->integer('sptier_sort_order')->default(0);
            $table->timestamps();

            $table->index('sptier_sp_id', 'idx_sptier_sp_id');
            $table->index('sptier_sort_order', 'idx_sptier_sort');
        });

        DB::statement("ALTER TABLE `supplier_price_tiers` CHANGE `sptier_id` `sptier_id` CHAR(36) NOT NULL DEFAULT uuid()");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_price_tiers');
        Schema::dropIfExists('supplier_product_tag_relations');
        Schema::dropIfExists('supplier_product_tags');
        Schema::dropIfExists('supplier_product_images');
        Schema::dropIfExists('supplier_products');
    }
};
