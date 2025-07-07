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
            $table->string('worksheet_id')->index(); // เชื่อมกับ worksheet
            $table->string('production_code')->unique(); // รหัสงานผลิต
            $table->string('customer_name'); // ชื่อลูกค้า
            $table->string('product_name'); // ชื่อสินค้า
            $table->integer('quantity'); // จำนวน
            $table->decimal('print_points', 10, 2)->nullable(); // จุดพิมพ์ที่คำนวณได้
            $table->date('start_date'); // วันที่เริ่มงาน
            $table->date('end_date'); // วันที่สิ้นสุดงาน
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending'); // สถานะงาน
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium'); // ความสำคัญ
            $table->text('notes')->nullable(); // หมายเหตุเพิ่มเติม
            $table->json('additional_data')->nullable(); // ข้อมูลเพิ่มเติมในรูปแบบ JSON
            $table->unsignedBigInteger('created_by'); // ผู้สร้าง
            $table->unsignedBigInteger('updated_by')->nullable(); // ผู้แก้ไขล่าสุด
            $table->timestamps();
            
            // Indexes
            $table->index(['status', 'start_date']);
            $table->index(['created_by', 'status']);
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
