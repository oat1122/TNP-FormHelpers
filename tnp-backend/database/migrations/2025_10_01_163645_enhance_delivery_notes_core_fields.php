<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_notes', function (Blueprint $table) {
            // 1) อ้างอิงใบแจ้งหนี้/รายการใบแจ้งหนี้
            if (!Schema::hasColumn('delivery_notes', 'invoice_id')) {
                $table->char('invoice_id', 36)->nullable()
                    ->after('company_id')
                    ->comment('ref invoices.id');
                $table->index('invoice_id', 'delivery_notes_invoice_id_index');
            }

            if (!Schema::hasColumn('delivery_notes', 'invoice_item_id')) {
                $table->char('invoice_item_id', 36)->nullable()
                    ->after('invoice_id')
                    ->comment('ref invoice_items.id');
                $table->index('invoice_item_id', 'delivery_notes_invoice_item_id_index');
            }

            // 2) cache เลขใบแจ้งหนี้สำหรับค้นหา/แสดงผลเร็ว
            if (!Schema::hasColumn('delivery_notes', 'invoice_number')) {
                $table->string('invoice_number', 50)->nullable()
                    ->after('invoice_item_id')
                    ->comment('เลขใบแจ้งหนี้ (cache เพื่อค้นหาเร็ว)');
                $table->index('invoice_number', 'delivery_notes_invoice_number_index');
            }

            // 3) toggle แหล่งข้อมูลลูกค้า + snapshot
            if (!Schema::hasColumn('delivery_notes', 'customer_data_source')) {
                $table->enum('customer_data_source', ['master','delivery'])->default('master')
                    ->after('customer_id')
                    ->comment('แหล่งข้อมูลลูกค้า (master/delivery)');
            }

            if (!Schema::hasColumn('delivery_notes', 'customer_snapshot')) {
                $table->longText('customer_snapshot')->nullable()
                    ->after('customer_lastname')
                    ->comment('JSON snapshot ข้อมูลลูกค้า ณ วันที่ออกใบส่งของ');
            }

            // 4) บริษัทผู้ส่งของ
            if (!Schema::hasColumn('delivery_notes', 'sender_company_id')) {
                $table->char('sender_company_id', 36)->nullable()
                    ->after('notes')
                    ->comment('บริษัทผู้ส่งของ (ref companies.id)');
                $table->index('sender_company_id', 'delivery_notes_sender_company_id_index');
            }
        });

        // หมายเหตุ: หากต้องการ Foreign Keys ให้เพิ่มใน migration แยกต่างหากเพื่อความยืดหยุ่นของสภาพแวดล้อม
        // Schema::table('delivery_notes', function (Blueprint $table) {
        //     $table->foreign('invoice_id')->references('id')->on('invoices')->nullOnDelete();
        //     $table->foreign('invoice_item_id')->references('id')->on('invoice_items')->nullOnDelete();
        //     $table->foreign('sender_company_id')->references('id')->on('companies')->nullOnDelete();
        // });
    }

    public function down(): void
    {
        Schema::table('delivery_notes', function (Blueprint $table) {
            // การลบคอลัมน์จะลบดัชนีบนคอลัมน์นั้นโดยอัตโนมัติ
            if (Schema::hasColumn('delivery_notes', 'sender_company_id')) {
                $table->dropColumn('sender_company_id');
            }
            if (Schema::hasColumn('delivery_notes', 'customer_snapshot')) {
                $table->dropColumn('customer_snapshot');
            }
            if (Schema::hasColumn('delivery_notes', 'customer_data_source')) {
                $table->dropColumn('customer_data_source');
            }
            if (Schema::hasColumn('delivery_notes', 'invoice_number')) {
                $table->dropColumn('invoice_number');
            }
            if (Schema::hasColumn('delivery_notes', 'invoice_item_id')) {
                $table->dropColumn('invoice_item_id');
            }
            if (Schema::hasColumn('delivery_notes', 'invoice_id')) {
                $table->dropColumn('invoice_id');
            }
        });
    }
};
