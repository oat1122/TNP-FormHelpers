<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // เพิ่ม Foreign Key Constraint สำหรับ inv_manage_by
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'user_uuid') && Schema::hasColumn('invoices', 'inv_manage_by')) {
            try {
                Schema::table('invoices', function (Blueprint $table) {
                    $table->foreign('inv_manage_by', 'fk_invoices_inv_manage_by')
                        ->references('user_uuid')->on('users')
                        ->onDelete('set null')->onUpdate('cascade');
                });
            } catch (Exception $e) {
                // Foreign key already exists or other issue
                // Log error but don't fail migration
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropForeign('fk_invoices_inv_manage_by');
            });
        } catch (Exception $e) {
            // Foreign key doesn't exist or other issue
        }
    }
};
