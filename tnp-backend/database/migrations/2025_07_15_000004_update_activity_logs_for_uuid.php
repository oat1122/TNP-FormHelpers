<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if activity_logs table exists and update max_supply_id to UUID
        if (Schema::hasTable('activity_logs')) {
            // Since there are no foreign key constraints, we can directly change the column type
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->uuid('max_supply_id')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('activity_logs')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->unsignedBigInteger('max_supply_id')->change();
            });
        }
    }
};
