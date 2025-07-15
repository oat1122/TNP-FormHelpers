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
        // อัปเดต production_type enum เพื่อเพิ่ม embroidery
        DB::statement("ALTER TABLE max_supplies MODIFY COLUMN production_type ENUM('screen', 'dtf', 'sublimation', 'embroidery') NOT NULL COMMENT 'ประเภทการผลิต'");
        
        // เพิ่ม embroidery_points column
        Schema::table('max_supplies', function (Blueprint $table) {
            $table->integer('embroidery_points')->default(0)->after('sublimation_points');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // ลบ embroidery_points column
        Schema::table('max_supplies', function (Blueprint $table) {
            $table->dropColumn('embroidery_points');
        });
        
        // คืนค่า production_type enum เป็นเดิม
        DB::statement("ALTER TABLE max_supplies MODIFY COLUMN production_type ENUM('screen', 'dtf', 'sublimation') NOT NULL COMMENT 'ประเภทการผลิต'");
    }
};
