<?php

/**
 * Migration 2: 2025_01_10_000002_create_invoice_items_table.php
 * สร้าง table invoice_items สำหรับเก็บรายการสินค้า
 */

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
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->char('id', 36)->primary()->default(DB::raw('(UUID())'));
            
            // References
            $table->char('invoice_id', 36)->comment('ref invoices.id');
            $table->char('quotation_item_id', 36)->nullable()->comment('ref quotation_items.id (ถ้ามาจาก quotation)');
            $table->char('pricing_request_id', 36)->nullable()->comment('ref pricing_requests.pr_id');
            
            // Item details
            $table->string('item_name')->comment('ชื่อสินค้า/งาน');
            $table->text('item_description')->nullable()->comment('รายละเอียดสินค้า');
            $table->integer('sequence_order')->default(1)->comment('ลำดับการแสดงผลต่อใบ');
            
            // Product specifications
            $table->string('pattern')->nullable()->comment('แพทเทิร์น');
            $table->string('fabric_type')->nullable()->comment('ประเภทผ้า');
            $table->string('color')->nullable()->comment('สี');
            $table->string('size')->nullable()->comment('ขนาด');
            
            // Pricing
            $table->decimal('unit_price', 12, 2)->default(0.00)->comment('ราคาต่อหน่วย');
            $table->integer('quantity')->default(0)->comment('จำนวน');
            $table->string('unit', 50)->default('ชิ้น')->comment('หน่วยนับ');
            
            // ใช้ virtual column แทน generated column เพื่อความเข้ากันได้
            $table->decimal('subtotal', 12, 2)->virtualAs('unit_price * quantity')->comment('ยอดรวม (auto)');
            
            // Discounts
            $table->decimal('discount_percentage', 5, 2)->default(0.00)->comment('ส่วนลด %');
            $table->decimal('discount_amount', 12, 2)->default(0.00)->comment('จำนวนส่วนลด');
            
            $table->decimal('final_amount', 12, 2)->virtualAs('(unit_price * quantity) - discount_amount')->comment('ยอดสุทธิหลังหักส่วนลด');
            
            // Additional data
            $table->longText('item_images')->nullable()->comment('รูปภาพสินค้า (JSON array)');
            $table->text('notes')->nullable()->comment('หมายเหตุรายการ');
            
            // Status
            $table->enum('status', ['draft', 'confirmed', 'delivered', 'cancelled'])
                ->default('draft')
                ->comment('สถานะของรายการ');
            
            // Audit fields
            $table->char('created_by', 36)->nullable()->comment('ผู้สร้าง (ref users.user_uuid)');
            $table->char('updated_by', 36)->nullable()->comment('ผู้แก้ไขล่าสุด (ref users.user_uuid)');
            $table->timestamps();
            
            // Indexes
            $table->unique(['invoice_id', 'sequence_order'], 'uq_invoice_items_invoice_sequence');
            $table->index('invoice_id', 'invoice_items_invoice_id_index');
            $table->index('quotation_item_id', 'invoice_items_quotation_item_id_index');
            $table->index('pricing_request_id', 'invoice_items_pricing_request_id_index');
            $table->index('sequence_order', 'invoice_items_sequence_order_index');
            $table->index('status', 'invoice_items_status_index');
            $table->index('created_by', 'invoice_items_created_by_index');
            $table->index('updated_by', 'invoice_items_updated_by_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
