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
        Schema::create('receipts', function (Blueprint $table) {
            $table->comment('ตารางใบเสร็จรับเงิน');
            
            // Primary key
            $table->char('id', 36)->primary()->default(\DB::raw('(UUID())'));
            $table->string('number', 50)->unique()->comment('เลขที่ใบเสร็จ');
            
            // Foreign Keys
            $table->char('invoice_id', 36)->nullable()->comment('อ้างอิงถึง invoices.id');
            $table->char('customer_id', 36)->nullable()->comment('อ้างอิงถึง master_customers.cus_id');
            
            // ข้อมูลลูกค้าที่ autofill
            $table->string('customer_company', 255)->nullable()->comment('ชื่อบริษัทลูกค้า');
            $table->char('customer_tax_id', 13)->nullable()->comment('เลขประจำตัวผู้เสียภาษี');
            $table->text('customer_address')->nullable()->comment('ที่อยู่ลูกค้า');
            $table->char('customer_zip_code', 5)->nullable()->comment('รหัสไปรษณีย์');
            $table->string('customer_tel_1', 50)->nullable()->comment('เบอร์โทรศัพท์');
            $table->string('customer_email', 255)->nullable()->comment('อีเมล์');
            $table->string('customer_firstname', 100)->nullable()->comment('ชื่อ');
            $table->string('customer_lastname', 100)->nullable()->comment('นามสกุล');
            
            // ข้อมูลงาน (copy จาก invoice)
            $table->string('work_name', 100)->nullable()->comment('ชื่องาน');
            $table->string('quantity', 10)->nullable()->comment('จำนวน');
            
            // ประเภทใบเสร็จ
            $table->enum('type', ['receipt', 'tax_invoice', 'full_tax_invoice'])
                  ->default('receipt')->comment('ประเภทใบเสร็จ');
            $table->enum('status', ['draft', 'approved', 'sent'])
                  ->default('draft')->comment('สถานะใบเสร็จ');
            
            // ข้อมูลการเงิน
            $table->decimal('subtotal', 15, 2)->default(0)->comment('ราคาก่อนภาษี');
            $table->decimal('tax_amount', 15, 2)->default(0)->comment('จำนวนภาษี');
            $table->decimal('total_amount', 15, 2)->default(0)->comment('ราคารวม');
            $table->string('payment_method', 50)->nullable()->comment('วิธีการชำระเงิน');
            $table->string('payment_reference', 100)->nullable()->comment('เลขที่อ้างอิงการชำระเงิน');
            $table->string('tax_invoice_number', 50)->nullable()->comment('เลขที่ใบกำกับภาษี');
            $table->text('notes')->nullable()->comment('หมายเหตุ');
            
            // Audit fields
            $table->char('issued_by', 36)->nullable()->comment('ผู้ออกใบเสร็จ');
            $table->char('approved_by', 36)->nullable()->comment('ผู้อนุมัติ');
            $table->timestamp('approved_at')->nullable()->comment('วันที่อนุมัติ');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            // Indexes
            $table->index('status');
            $table->index('type');
            $table->index('customer_id');
            $table->index('invoice_id');
            $table->index('tax_invoice_number');
            $table->index('created_at');
            
            // Foreign key constraints
            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('set null');
            $table->foreign('customer_id')->references('cus_id')->on('master_customers')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
