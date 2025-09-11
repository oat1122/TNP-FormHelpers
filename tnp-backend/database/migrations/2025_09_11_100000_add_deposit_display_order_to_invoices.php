<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('invoices') && !Schema::hasColumn('invoices', 'deposit_display_order')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->string('deposit_display_order', 10)->default('after')->comment('การแสดงมัดจำ: before = มัดจำก่อน, after = มัดจำหลัง')->after('deposit_amount');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'deposit_display_order')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropColumn('deposit_display_order');
            });
        }
    }
};
