<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('delivery_notes', function (Blueprint $table) {
            if (!Schema::hasColumn('delivery_notes', 'customer_tax_id')) {
                $table->string('customer_tax_id', 50)->nullable()->after('customer_tel_1')->comment('เลขประจำตัวผู้เสียภาษี');
            }
        });
    }

    public function down(): void
    {
        Schema::table('delivery_notes', function (Blueprint $table) {
            if (Schema::hasColumn('delivery_notes', 'customer_tax_id')) {
                $table->dropColumn('customer_tax_id');
            }
        });
    }
};
