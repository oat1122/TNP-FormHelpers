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
        Schema::create('max_supplies', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('รหัสงาน เช่น MS-001, MS-002');
            $table->char('worksheet_id', 36)->comment('ไอดีตาราง new_worksheets');
            $table->char('screen_id', 36)->nullable()->comment('ไอดีตาราง new_worksheet_screens');
            $table->string('title', 255)->comment('ชื่องาน');
            $table->string('customer_name', 255)->comment('ชื่อลูกค้า');
            $table->enum('production_type', ['screen', 'dtf', 'sublimation'])->comment('ประเภทการผลิต');
            
            // วันที่
            $table->date('start_date')->comment('วันที่เริ่มงาน');
            $table->date('expected_completion_date')->comment('วันที่คาดว่าจะเสร็จ');
            $table->date('due_date')->comment('วันที่กำหนดส่ง');
            $table->date('actual_completion_date')->nullable()->comment('วันที่เสร็จจริง');
            
            // สถานะ
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending')->comment('สถานะงาน');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal')->comment('ความสำคัญ');
            
            // ข้อมูลการผลิต
            $table->enum('shirt_type', ['polo', 't-shirt', 'hoodie', 'tank-top'])->comment('ประเภทเสื้อ');
            $table->integer('total_quantity')->comment('จำนวนทั้งหมด');
            $table->integer('completed_quantity')->default(0)->comment('จำนวนที่ผลิตเสร็จแล้ว');
            $table->json('sizes')->comment('ขนาด และจำนวนตามไซส์ {"S": 50, "M": 150, "L": 200, "XL": 100}');
            
            // จุดพิมพ์แยกตามประเภท
            $table->integer('screen_points')->default(0)->comment('จำนวนจุดพิมพ์ประเภท Screen');
            $table->integer('dtf_points')->default(0)->comment('จำนวนจุดพิมพ์ประเภท DTF');
            $table->integer('sublimation_points')->default(0)->comment('จำนวนจุดพิมพ์ประเภท Sublimation');
            
            // หมายเหตุ
            $table->text('notes')->nullable()->comment('หมายเหตุ');
            $table->text('special_instructions')->nullable()->comment('คำแนะนำพิเศษ');
            
            // ผู้สร้างและแก้ไข
            $table->char('created_by', 36)->nullable()->comment('ผู้สร้างงาน');
            $table->char('updated_by', 36)->nullable()->comment('ผู้แก้ไขล่าสุด');
            
            $table->timestamps();
            
            // Indexes
            $table->index('code');
            $table->index('worksheet_id');
            $table->index('production_type');
            $table->index('status');
            $table->index('start_date');
            $table->index('due_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('max_supplies');
    }
};
