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
        if (!Schema::hasTable('quotation_items')) {
            Schema::create('quotation_items', function (Blueprint $table) {
                $table->comment('ตารางรายละเอียดสินค้าในใบเสนอราคา (แยกแต่ละรายการ)');

                // Primary key
                $table->char('id', 36)->primary()->default(\DB::raw('(UUID())'));

                // Foreign keys
                $table->char('quotation_id', 36)->comment('อ้างอิงถึง quotations.id');
                $table->char('pricing_request_id', 36)->nullable()->comment('อ้างอิงถึง pricing_requests.pr_id');

                // Item fields
                $table->string('item_name', 255)->comment('ชื่อสินค้า/งาน');
                $table->text('item_description')->nullable()->comment('รายละเอียดสินค้า');
                $table->integer('sequence_order')->default(1)->comment('ลำดับการแสดงผล');
                $table->string('pattern', 255)->nullable()->comment('แพทเทิร์น');
                $table->string('fabric_type', 255)->nullable()->comment('ประเภทผ้า');
                $table->string('color', 255)->nullable()->comment('สี');
                $table->string('size', 255)->nullable()->comment('ขนาด');
                $table->decimal('unit_price', 12, 2)->default(0.00)->comment('ราคาต่อหน่วย');
                $table->integer('quantity')->default(0)->comment('จำนวน');
                $table->string('unit', 50)->default('ชิ้น')->comment('หน่วยนับ');

                // Calculated amounts
                // ใช้ generated column สำหรับ subtotal และ final_amount ถ้าฐานข้อมูลรองรับ
                try {
                    $table->decimal('subtotal', 12, 2)->storedAs('unit_price * quantity')->comment('ยอดรวม (คำนวณอัตโนมัติ)');
                } catch (\Throwable $e) {
                    // Fallback ถ้า storedAs ไม่รองรับในบาง DB เวอร์ชัน
                    $table->decimal('subtotal', 12, 2)->default(0.00)->comment('ยอดรวม (คำนวณอัตโนมัติ)');
                }
                $table->decimal('discount_percentage', 5, 2)->default(0.00)->comment('ส่วนลดเปอร์เซ็นต์');
                $table->decimal('discount_amount', 12, 2)->default(0.00)->comment('จำนวนเงินส่วนลด');
                try {
                    $table->decimal('final_amount', 12, 2)->storedAs('(unit_price * quantity) - discount_amount')->comment('ยอดสุทธิหลังหักส่วนลด');
                } catch (\Throwable $e) {
                    $table->decimal('final_amount', 12, 2)->default(0.00)->comment('ยอดสุทธิหลังหักส่วนลด');
                }

                // JSON images (ไม่ใส่ CHECK constraint เพื่อความเข้ากันได้)
                $table->longText('item_images')->nullable()->comment('รูปภาพสินค้า (JSON array)');

                // Notes & status
                $table->text('notes')->nullable()->comment('หมายเหตุสำหรับรายการนี้');
                $table->enum('status', ['draft','confirmed','in_production','completed','cancelled'])->default('draft')->comment('สถานะของรายการสินค้า');

                // Audit
                $table->char('created_by', 36)->nullable()->comment('ผู้สร้าง');
                $table->char('updated_by', 36)->nullable()->comment('ผู้แก้ไขล่าสุด');
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

                // Indexes
                $table->index('quotation_id', 'quotation_items_quotation_id_index');
                $table->index('pricing_request_id', 'quotation_items_pricing_request_id_index');
                $table->index('sequence_order', 'quotation_items_sequence_order_index');
                $table->index('status', 'quotation_items_status_index');
                $table->index(['quotation_id', 'sequence_order'], 'idx_quotation_items_order');

                // Foreign keys
                $table->foreign('quotation_id')
                      ->references('id')->on('quotations')
                      ->onDelete('cascade');
                // หมายเหตุ: ไม่ใส่ FK ของ pricing_request_id เพื่อลดปัญหาความเข้ากันได้ของระบบเดิม
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_items');
    }
};
