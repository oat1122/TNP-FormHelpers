<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Alter the 'role' enum column to include 'telesale'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'production', 'graphic', 'sale', 'technician', 'telesale') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Check if any users have 'telesale' role before rolling back
        $telesaleCount = DB::table('users')->where('role', 'telesale')->count();
        
        if ($telesaleCount > 0) {
            throw new \Exception("Cannot rollback: {$telesaleCount} user(s) have 'telesale' role. Please reassign them first.");
        }
        
        // Rollback to original enum values
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'production', 'graphic', 'sale', 'technician') NOT NULL");
    }
};
