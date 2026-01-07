<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('master_sub_roles', function (Blueprint $table) {
            $table->char('msr_id', 36)->primary()->comment('Primary key UUID');
            $table->string('msr_code', 50)->unique()->comment('รหัส Sub Role เช่น HEAD_ONLINE');
            $table->string('msr_name', 100)->comment('ชื่อ Sub Role');
            $table->text('msr_description')->nullable()->comment('รายละเอียด');
            $table->boolean('msr_is_active')->default(true)->comment('สถานะการใช้งาน');
            $table->integer('msr_sort')->default(0)->comment('ลำดับการแสดงผล');
            $table->timestamps();
            $table->bigInteger('created_by')->nullable()->comment('ผู้สร้าง');
            $table->bigInteger('updated_by')->nullable()->comment('ผู้แก้ไขล่าสุด');

            // Indexes
            $table->index('msr_is_active', 'idx_msr_is_active');
            $table->index('msr_sort', 'idx_msr_sort');
        });

        // Set charset and collation to match users table
        DB::statement('ALTER TABLE master_sub_roles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        // Seed initial Sub Roles
        $this->seedInitialSubRoles();
    }

    /**
     * Seed initial Sub Roles: HEAD_ONLINE, HEAD_OFFLINE
     */
    private function seedInitialSubRoles(): void
    {
        $subRoles = [
            [
                'msr_id' => (string) Str::uuid(),
                'msr_code' => 'HEAD_ONLINE',
                'msr_name' => 'หัวหน้าฝ่ายออนไลน์',
                'msr_description' => 'หัวหน้าทีมขายช่องทางออนไลน์',
                'msr_is_active' => true,
                'msr_sort' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'msr_id' => (string) Str::uuid(),
                'msr_code' => 'HEAD_OFFLINE',
                'msr_name' => 'หัวหน้าฝ่ายออฟไลน์',
                'msr_description' => 'หัวหน้าทีมขายช่องทางออฟไลน์',
                'msr_is_active' => true,
                'msr_sort' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('master_sub_roles')->insert($subRoles);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_sub_roles');
    }
};
