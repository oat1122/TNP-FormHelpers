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
        Schema::table('invoices', function (Blueprint $table) {
            $table->enum('status_before', ['draft', 'pending', 'approved', 'rejected'])
                  ->default('draft')
                  ->after('status')
                  ->comment('Status for before deposit mode');
                  
            $table->enum('status_after', ['draft', 'pending', 'approved', 'rejected'])
                  ->default('draft')
                  ->after('status_before')
                  ->comment('Status for after deposit mode');
        });

        // Backfill existing data based on current status and deposit_amount
        DB::statement("
            UPDATE invoices
            SET
                status_before = CASE
                    WHEN status IN ('draft', 'pending', 'approved', 'rejected') THEN status
                    ELSE 'draft'
                END,
                status_after = CASE
                    WHEN deposit_amount > 0 THEN
                        CASE
                            WHEN status = 'approved' THEN 'pending'
                            WHEN status IN ('draft', 'pending', 'rejected') THEN status
                            ELSE 'draft'
                        END
                    ELSE
                        CASE
                            WHEN status IN ('draft', 'pending', 'approved', 'rejected') THEN status
                            ELSE 'draft'
                        END
                END
            WHERE status_before IS NULL OR status_after IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['status_before', 'status_after']);
        });
    }
};