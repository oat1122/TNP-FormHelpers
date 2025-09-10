<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('invoices', 'evidence_files')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->longText('evidence_files')->nullable()->after('sample_images')->comment('JSON array ของหลักฐานการชำระ / อื่นๆ');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('invoices', 'evidence_files')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropColumn('evidence_files');
            });
        }
    }
};
