<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('delivery_note_items')) {
            Schema::create('delivery_note_items', function (Blueprint $table) {
                $table->char('id', 36)->primary()->default(DB::raw('uuid()'));

                // ความสัมพันธ์หลัก
                $table->char('delivery_note_id', 36)->comment('ref delivery_notes.id');
                $table->char('invoice_id', 36)->nullable()->comment('ref invoices.id (option)');
                $table->char('invoice_item_id', 36)->nullable()->comment('ref invoice_items.id');

                // ข้อมูลรายการงานบนใบส่งของ (ของ "ครั้งนี้")
                $table->integer('sequence_order')->default(1)->comment('ลำดับการแสดงผล');
                $table->string('item_name', 255)->comment('ชื่อสินค้า/งาน');
                $table->text('item_description')->nullable()->comment('รายละเอียดเพิ่มเติม');
                $table->string('pattern', 255)->nullable();
                $table->string('fabric_type', 255)->nullable();
                $table->string('color', 255)->nullable();
                $table->string('size', 255)->nullable();

                $table->integer('delivered_quantity')->default(0)->comment('จำนวนที่ส่งในใบนี้');
                $table->string('unit', 50)->default('ชิ้น')->comment('หน่วยนับ');

                // snapshot รายการอ้างอิง (จาก invoice_items) เพื่อกันข้อมูลต้นทางเปลี่ยน
                $table->longText('item_snapshot')->nullable()->comment('JSON snapshot จาก invoice_items');

                // สถานะรายการในใบส่งของ
                $table->enum('status', ['ready','delivered','cancelled'])->default('ready');

                // ผู้ใช้งาน
                $table->char('created_by', 36)->nullable()->comment('ref users.user_uuid');
                $table->char('updated_by', 36)->nullable()->comment('ref users.user_uuid');

                $table->timestamps();

                // indexes
                $table->index('delivery_note_id', 'dni_delivery_note_id_index');
                $table->index('invoice_id', 'dni_invoice_id_index');
                $table->index('invoice_item_id', 'dni_invoice_item_id_index');
                $table->index('sequence_order', 'dni_sequence_order_index');
                $table->index('status', 'dni_status_index');

                // FK ที่แนะนำ (เปิดใช้เมื่อพร้อม)
                $table->foreign('delivery_note_id')->references('id')->on('delivery_notes')->cascadeOnDelete();
                // $table->foreign('invoice_id')->references('id')->on('invoices')->nullOnDelete();
                // $table->foreign('invoice_item_id')->references('id')->on('invoice_items')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_note_items');
    }
};
