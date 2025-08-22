<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            if (!Schema::hasColumn('quotations', 'deposit_mode')) {
                $table->string('deposit_mode', 20)->nullable()->after('deposit_amount')->comment('percentage | amount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            if (Schema::hasColumn('quotations', 'deposit_mode')) {
                $table->dropColumn('deposit_mode');
            }
        });
    }
};
