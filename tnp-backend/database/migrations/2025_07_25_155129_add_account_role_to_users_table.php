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
        // อัปเดต role enum เพื่อเพิ่ม account
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','manager','account','production','graphic','sale','technician') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // คืนค่า role enum เป็นเดิม
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','manager','production','graphic','sale','technician') NOT NULL");
    }
};
