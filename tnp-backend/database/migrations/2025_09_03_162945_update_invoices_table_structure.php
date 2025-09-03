<?php

/**
 * Migration 1: 2025_01_10_000001_update_invoices_table_structure.php
 * ปรับปรุงโครงสร้าง invoices table ให้สอดคล้องกับ quotations
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
        Schema::table('invoices', function (Blueprint $table) {
            // เพิ่ม columns ใหม่หลัง quotation_id
            $table->char('primary_pricing_request_id', 36)->nullable()
                ->after('quotation_id')
                ->comment('อ้างอิงถึง pricing_requests.pr_id หลัก');
            
            $table->longText('primary_pricing_request_ids')->nullable()
                ->after('primary_pricing_request_id')
                ->comment('JSON array ของ PR IDs');
            
            // เพิ่ม customer snapshot หลัง customer_lastname
            $table->longText('customer_snapshot')->nullable()
                ->after('customer_lastname')
                ->comment('snapshot ข้อมูลลูกค้า ณ เวลาออกใบแจ้งหนี้');
            
            // ปรับปรุงการจัดการส่วนลด หลัง total_amount
            $table->decimal('special_discount_percentage', 5, 2)->default(0.00)
                ->after('total_amount')
                ->comment('ส่วนลดพิเศษ %');
            
            $table->decimal('special_discount_amount', 15, 2)->default(0.00)
                ->after('special_discount_percentage')
                ->comment('จำนวนเงินส่วนลดพิเศษ');
            
            // เพิ่มการจัดการภาษีหัก ณ ที่จ่าย หลัง vat_amount
            $table->boolean('has_withholding_tax')->default(false)
                ->after('vat_amount')
                ->comment('มีหักภาษี ณ ที่จ่าย');
            
            $table->decimal('withholding_tax_percentage', 5, 2)->default(0.00)
                ->after('has_withholding_tax')
                ->comment('เปอร์เซ็นต์ภาษีหัก ณ ที่จ่าย');
            
            $table->decimal('withholding_tax_amount', 15, 2)->default(0.00)
                ->after('withholding_tax_percentage')
                ->comment('จำนวนภาษีหัก ณ ที่จ่าย');
            
            // ยอดสุทธิสุดท้าย
            $table->decimal('final_total_amount', 15, 2)->default(0.00)
                ->after('withholding_tax_amount')
                ->comment('ยอดสุทธิสุดท้าย (หลังหักส่วนลดพิเศษและภาษี ณ ที่จ่าย)');
            
            // การจัดการเงินมัดจำ
            $table->integer('deposit_percentage')->default(0)
                ->after('final_total_amount')
                ->comment('เปอร์เซ็นต์เงินมัดจำ');
            
            $table->decimal('deposit_amount', 15, 2)->default(0.00)
                ->after('deposit_percentage')
                ->comment('จำนวนเงินมัดจำ');
            
            $table->string('deposit_mode', 20)->nullable()
                ->after('deposit_amount')
                ->comment('percentage | amount');
            
            // รูปภาพลายเซ็น หลัง notes
            $table->longText('signature_images')->nullable()
                ->after('notes')
                ->comment('JSON array ของไฟล์หลักฐานการเซ็น');
            
            // รูปภาพตัวอย่าง
            $table->longText('sample_images')->nullable()
                ->after('signature_images')
                ->comment('ข้อมูลรูปภาพตัวอย่างสินค้า/บริการ');
            
            // การติดตาม user ที่แก้ไข หลัง created_by
            $table->char('updated_by', 36)->nullable()
                ->after('created_by')
                ->comment('ผู้แก้ไขล่าสุด (ref users.user_uuid)');
            
            // เพิ่ม indexes
            $table->index('primary_pricing_request_id', 'invoices_primary_pricing_request_id_index');
            $table->index('updated_by', 'invoices_updated_by_index');
            $table->index('deposit_amount', 'invoices_deposit_amount_index');
            $table->index('final_total_amount', 'invoices_final_total_amount_index');
        });

        // ย้าย work_name จากที่จะลบไปก่อน เก็บไว้ที่ header level
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('work_name_new', 100)->nullable()
                ->after('customer_snapshot')
                ->comment('ชื่องาน (หัวใบ)');
        });

        // Copy ข้อมูล work_name เดิม
        DB::statement('UPDATE invoices SET work_name_new = work_name WHERE work_name IS NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // ลบ indexes
            $table->dropIndex('invoices_primary_pricing_request_id_index');
            $table->dropIndex('invoices_updated_by_index');
            $table->dropIndex('invoices_deposit_amount_index');
            $table->dropIndex('invoices_final_total_amount_index');
            
            // ลบ columns ที่เพิ่มเข้าไป
            $table->dropColumn([
                'primary_pricing_request_id',
                'primary_pricing_request_ids',
                'customer_snapshot',
                'special_discount_percentage',
                'special_discount_amount',
                'has_withholding_tax',
                'withholding_tax_percentage',
                'withholding_tax_amount',
                'final_total_amount',
                'deposit_percentage',
                'deposit_amount',
                'deposit_mode',
                'signature_images',
                'sample_images',
                'updated_by',
                'work_name_new'
            ]);
        });
    }
};
