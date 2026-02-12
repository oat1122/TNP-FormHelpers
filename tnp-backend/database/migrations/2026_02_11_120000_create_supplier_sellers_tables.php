<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. supplier_sellers
        Schema::create('supplier_sellers', function (Blueprint $table) {
            $table->comment('ตารางผู้ขาย (Seller)');
            $table->char('ss_id', 36)->primary();
            $table->string('ss_company_name', 255)->comment('ชื่อบริษัท');
            $table->string('ss_tax_id', 20)->nullable()->comment('เลขผู้เสียภาษี');
            $table->string('ss_phone', 50)->nullable()->comment('เบอร์โทรปัจจุบัน');
            $table->string('ss_country', 100)->nullable()->comment('ประเทศ');
            $table->text('ss_address')->nullable()->comment('ที่อยู่');
            $table->string('ss_contact_person', 255)->nullable()->comment('ชื่อผู้ติดต่อ');
            $table->text('ss_remark')->nullable()->comment('หมายเหตุ');
            $table->boolean('ss_is_deleted')->default(false);
            $table->char('ss_created_by', 36)->nullable()->comment('ref users.user_uuid');
            $table->char('ss_updated_by', 36)->nullable()->comment('ref users.user_uuid');
            $table->timestamps();

            $table->index('ss_company_name', 'idx_ss_company_name');
            $table->index('ss_is_deleted', 'idx_ss_is_deleted');
        });

        DB::statement("ALTER TABLE `supplier_sellers` CHANGE `ss_id` `ss_id` CHAR(36) NOT NULL DEFAULT uuid()");

        // 2. supplier_seller_phone_logs
        Schema::create('supplier_seller_phone_logs', function (Blueprint $table) {
            $table->comment('ประวัติเปลี่ยนเบอร์โทร Seller');
            $table->char('sspl_id', 36)->primary();
            $table->char('sspl_ss_id', 36)->comment('FK: supplier_sellers.ss_id');
            $table->string('sspl_old_phone', 50)->nullable()->comment('เบอร์เก่า');
            $table->string('sspl_new_phone', 50)->nullable()->comment('เบอร์ใหม่');
            $table->char('sspl_changed_by', 36)->nullable()->comment('ref users.user_uuid');
            $table->timestamp('created_at')->nullable();

            $table->index('sspl_ss_id', 'idx_sspl_ss_id');
        });

        DB::statement("ALTER TABLE `supplier_seller_phone_logs` CHANGE `sspl_id` `sspl_id` CHAR(36) NOT NULL DEFAULT uuid()");

        // 3. Add sp_ss_id to supplier_products
        Schema::table('supplier_products', function (Blueprint $table) {
            $table->char('sp_ss_id', 36)
                ->nullable()
                ->after('sp_mpc_id')
                ->comment('FK: supplier_sellers.ss_id');
            $table->index('sp_ss_id', 'idx_sp_ss_id');
        });
    }

    public function down(): void
    {
        Schema::table('supplier_products', function (Blueprint $table) {
            $table->dropIndex('idx_sp_ss_id');
            $table->dropColumn('sp_ss_id');
        });
        Schema::dropIfExists('supplier_seller_phone_logs');
        Schema::dropIfExists('supplier_sellers');
    }
};
