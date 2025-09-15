<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'deposit_display_order')) {
                $table->string('deposit_display_order', 10)
                    ->default('after')
                    ->comment("การแสดงมัดจำ: before = มัดจำก่อน, after = มัดจำหลัง")
                    ->after('deposit_amount');
                // Optional index for filtering by presentation (not required by SQL, skipping)
            }
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (Schema::hasColumn('invoices', 'deposit_display_order')) {
                $table->dropColumn('deposit_display_order');
            }
        });
    }
};
