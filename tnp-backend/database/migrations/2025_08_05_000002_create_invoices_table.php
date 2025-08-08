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
        Schema::create('invoices', function (Blueprint $table) {
            $table->comment('ตารางใบแจ้งหนี้');
            
            // Primary key
            $table->char('id', 36)->primary()->default(\DB::raw('(UUID())'));
            $table->string('number', 50)->unique()->comment('เลขที่ใบแจ้งหนี้');
            
            // Foreign Keys
            $table->char('quotation_id', 36)->nullable()->comment('อ้างอิงถึง quotations.id');
            $table->char('customer_id', 36)->nullable()->comment('อ้างอิงถึง master_customers.cus_id');
            
            // ข้อมูลลูกค้าที่ autofill จาก quotations/master_customers
            $table->string('customer_company', 255)->nullable()->comment('ชื่อบริษัทลูกค้า');
            $table->char('customer_tax_id', 13)->nullable()->comment('เลขประจำตัวผู้เสียภาษี');
            $table->text('customer_address')->nullable()->comment('ที่อยู่ลูกค้า');
            $table->char('customer_zip_code', 5)->nullable()->comment('รหัสไปรษณีย์');
            $table->string('customer_tel_1', 50)->nullable()->comment('เบอร์โทรศัพท์');
            $table->string('customer_email', 255)->nullable()->comment('อีเมล์');
            $table->string('customer_firstname', 100)->nullable()->comment('ชื่อ');
            $table->string('customer_lastname', 100)->nullable()->comment('นามสกุล');
            
            // ข้อมูลงาน (copy จาก quotation)
            $table->string('work_name', 100)->nullable()->comment('ชื่องาน');
            $table->string('fabric_type', 255)->nullable()->comment('ชนิดผ้า');
            $table->string('pattern', 255)->nullable()->comment('แพทเทิร์น');
            $table->string('color', 255)->nullable()->comment('สีสินค้า');
            $table->string('sizes', 255)->nullable()->comment('ไซซ์');
            $table->string('quantity', 10)->nullable()->comment('จำนวน');
            
            // สถานะและข้อมูลการเงิน
            $table->enum('status', ['draft', 'pending', 'approved', 'sent', 'partial_paid', 'fully_paid', 'overdue'])
                  ->default('draft')->comment('สถานะใบแจ้งหนี้');
            $table->decimal('subtotal', 15, 2)->default(0)->comment('ราคาก่อนภาษี');
            $table->decimal('tax_amount', 15, 2)->default(0)->comment('จำนวนภาษี');
            $table->decimal('total_amount', 15, 2)->default(0)->comment('ราคารวม');
            $table->decimal('paid_amount', 15, 2)->default(0)->comment('จำนวนเงินที่ชำระแล้ว');
            $table->date('due_date')->nullable()->comment('วันครบกำหนดชำระ');
            $table->string('payment_method', 50)->nullable()->comment('วิธีการชำระเงิน');
            $table->text('notes')->nullable()->comment('หมายเหตุ');
            
            // Audit fields
            $table->char('created_by', 36)->nullable()->comment('ผู้สร้าง');
            $table->char('approved_by', 36)->nullable()->comment('ผู้อนุมัติ');
            $table->timestamp('approved_at')->nullable()->comment('วันที่อนุมัติ');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            // Indexes
            $table->index('status');
            $table->index('customer_id');
            $table->index('quotation_id');
            $table->index('due_date');
            $table->index('created_at');
            
            // Foreign key constraints - temporarily disabled due to existing table structure
            // $table->foreign('quotation_id')->references('id')->on('quotations')->onDelete('set null');
            // $table->foreign('customer_id')->references('cus_id')->on('master_customers')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
