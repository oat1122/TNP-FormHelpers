<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('delivery_notes', function (Blueprint $table) {
            if (!Schema::hasColumn('delivery_notes', 'manage_by')) {
                $table->unsignedBigInteger('manage_by')->nullable()->after('sender_company_id')->comment('ผู้ดูแล (ref users.user_id)');
                $table->index('manage_by', 'delivery_notes_manage_by_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('delivery_notes', function (Blueprint $table) {
            if (Schema::hasColumn('delivery_notes', 'manage_by')) {
                $table->dropIndex('delivery_notes_manage_by_index');
                $table->dropColumn('manage_by');
            }
        });
    }
};
