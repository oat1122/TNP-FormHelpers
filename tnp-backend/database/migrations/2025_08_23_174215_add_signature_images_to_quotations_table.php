<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            // เก็บ path ของรูปหลักฐานการเซ็น (array JSON)
            if (!Schema::hasColumn('quotations', 'signature_images')) {
                $table->longText('signature_images')->nullable()->comment('JSON array ของไฟล์หลักฐานการเซ็น')->after('notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            if (Schema::hasColumn('quotations', 'signature_images')) {
                $table->dropColumn('signature_images');
            }
        });
    }
};
