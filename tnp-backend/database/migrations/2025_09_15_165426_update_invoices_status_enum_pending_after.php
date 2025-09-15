<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add 'pending_after' to invoices.status enum
        // Note: Laravel schema builder can't modify ENUM easily; use raw SQL compatible with MySQL.
        $table = DB::getTablePrefix() . 'invoices';
        DB::statement("ALTER TABLE `$table` MODIFY `status` ENUM('draft','pending','pending_after','approved','sent','partial_paid','fully_paid','overdue') NOT NULL DEFAULT 'draft'");
    }

    public function down(): void
    {
        // Revert to original enum without 'pending_after'
        $table = DB::getTablePrefix() . 'invoices';
        DB::statement("ALTER TABLE `$table` MODIFY `status` ENUM('draft','pending','approved','sent','partial_paid','fully_paid','overdue') NOT NULL DEFAULT 'draft'");
    }
};
