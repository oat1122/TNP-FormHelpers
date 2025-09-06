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
        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'customer_data_source')) {
                $table->string('customer_data_source', 20)
                    ->default('master')
                    ->comment("แหล่งข้อมูลลูกค้า: 'master_customer' หรือ 'invoice'")
                    ->after('customer_lastname');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (Schema::hasColumn('invoices', 'customer_data_source')) {
                $table->dropColumn('customer_data_source');
            }
        });
    }
};
