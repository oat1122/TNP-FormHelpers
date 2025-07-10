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
        Schema::create('max_supplies', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('รหัสงาน MS-001, MS-002');
            $table->char('worksheet_id', 36)->comment('ไอดีตาราง new_worksheets');
            $table->string('title', 255)->comment('ชื่องาน');
            $table->string('customer_name', 255)->comment('ชื่อลูกค้า');
            $table->enum('production_type', ['screen', 'dtf', 'sublimation'])->comment('ประเภทการผลิต');

            // วันที่
            $table->date('start_date')->comment('วันที่เริ่มผลิต');
            $table->date('expected_completion_date')->comment('วันที่คาดว่าจะเสร็จ');
            $table->date('due_date')->comment('วันครบกำหนด');
            $table->date('actual_completion_date')->nullable()->comment('วันที่เสร็จจริง');

            // สถานะ
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');

            // ข้อมูลการผลิต
            $table->enum('shirt_type', ['polo', 't-shirt', 'hoodie', 'tank-top'])->comment('ประเภทเสื้อ');
            $table->integer('total_quantity')->comment('จำนวนรวม');
            $table->integer('completed_quantity')->default(0)->comment('จำนวนที่เสร็จแล้ว');
            $table->json('sizes')->comment('ขนาดและจำนวน {"S": 50, "M": 150, "L": 200, "XL": 100}');

            // จุดพิมพ์แยกตามประเภท
            $table->integer('screen_points')->default(0);
            $table->integer('dtf_points')->default(0);
            $table->integer('sublimation_points')->default(0);

            // หมายเหตุ
            $table->text('notes')->nullable();
            $table->text('special_instructions')->nullable();

            // ผู้สร้างและแก้ไข - เปลี่ยนเป็น char(36) เพื่อให้ตรงกับ UUID
            $table->char('created_by', 36)->nullable();
            $table->char('updated_by', 36)->nullable();

            $table->timestamps();

            // Indexes
            $table->index('code');
            $table->index('worksheet_id');
            $table->index('production_type');
            $table->index('status');
            $table->index('start_date');
            $table->index('due_date');
            $table->index('created_by');
        });

        // เพิ่ม Foreign Key Constraints แยกออกมา และใช้ DB::statement เพื่อความแน่ใจ
        if (Schema::hasTable('new_worksheets')) {
            Schema::table('max_supplies', function (Blueprint $table) {
                $table->foreign('worksheet_id')
                      ->references('worksheet_id')
                      ->on('new_worksheets')
                      ->onDelete('cascade');
            });
        }

        // เพิ่ม Foreign Key สำหรับ users ก็ต่อเมื่อ table มีอยู่
        if (Schema::hasTable('users')) {
            // ตรวจสอบ column type ของ users.user_id ก่อน
            $userIdType = DB::select("SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'user_id'");
            
            if (!empty($userIdType)) {
                Schema::table('max_supplies', function (Blueprint $table) {
                    $table->foreign('created_by')->references('user_id')->on('users')->onDelete('set null');
                    $table->foreign('updated_by')->references('user_id')->on('users')->onDelete('set null');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('max_supplies');
    }
};
