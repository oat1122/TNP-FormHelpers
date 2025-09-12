<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing invoices where deposit_display_order is 'after' and set it to 'before' as default
        // This only affects invoices that are still using the old default value
        DB::table('invoices')
            ->whereNull('deposit_display_order')
            ->orWhere('deposit_display_order', 'after')
            ->where('created_at', '>=', now()->subDays(1)) // Only recent invoices to avoid affecting intentionally set 'after' mode
            ->update(['deposit_display_order' => 'before']);

        // Update the column default in the database schema
        if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'deposit_display_order')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->string('deposit_display_order', 10)->default('before')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert the column default back to 'after'
        if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'deposit_display_order')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->string('deposit_display_order', 10)->default('after')->change();
            });
        }
    }
};