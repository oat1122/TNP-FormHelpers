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
        Schema::create('delivery_notes', function (Blueprint $table) {
            $table->comment('ตารางใบส่งของ');
            
            // Primary key
            $table->char('id', 36)->primary()->default(\DB::raw('(UUID())'));
            $table->string('number', 50)->unique()->comment('เลขที่ใบส่งของ');
            
            // Foreign Keys
            $table->char('receipt_id', 36)->nullable()->comment('อ้างอิงถึง receipts.id');
            $table->char('customer_id', 36)->nullable()->comment('อ้างอิงถึง master_customers.cus_id');
            
            // ข้อมูลลูกค้าที่ autofill
            $table->string('customer_company', 255)->nullable()->comment('ชื่อบริษัทลูกค้า');
            $table->text('customer_address')->nullable()->comment('ที่อยู่ลูกค้า');
            $table->char('customer_zip_code', 5)->nullable()->comment('รหัสไปรษณีย์');
            $table->string('customer_tel_1', 50)->nullable()->comment('เบอร์โทรศัพท์');
            $table->string('customer_firstname', 100)->nullable()->comment('ชื่อ');
            $table->string('customer_lastname', 100)->nullable()->comment('นามสกุล');
            
            // ข้อมูลงาน (copy จาก receipt)
            $table->string('work_name', 100)->nullable()->comment('ชื่องาน');
            $table->string('quantity', 10)->nullable()->comment('จำนวน');
            
            // สถานะการจัดส่ง
            $table->enum('status', ['preparing', 'shipping', 'in_transit', 'delivered', 'completed', 'failed'])
                  ->default('preparing')->comment('สถานะการจัดส่ง');
            $table->enum('delivery_method', ['self_delivery', 'courier', 'customer_pickup'])
                  ->default('courier')->comment('วิธีการจัดส่ง');
            
            // ข้อมูลการจัดส่ง
            $table->string('courier_company', 100)->nullable()->comment('บริษัทขนส่ง');
            $table->string('tracking_number', 100)->nullable()->comment('เลขที่ติดตาม');
            $table->text('delivery_address')->nullable()->comment('ที่อยู่จัดส่ง');
            $table->string('recipient_name', 255)->nullable()->comment('ชื่อผู้รับ');
            $table->string('recipient_phone', 50)->nullable()->comment('เบอร์โทรผู้รับ');
            $table->date('delivery_date')->nullable()->comment('วันที่กำหนดส่ง');
            $table->timestamp('delivered_at')->nullable()->comment('วันเวลาที่ส่งถึง');
            $table->text('delivery_notes')->nullable()->comment('หมายเหตุการจัดส่ง');
            $table->text('notes')->nullable()->comment('หมายเหตุทั่วไป');
            
            // Audit fields
            $table->char('created_by', 36)->nullable()->comment('ผู้สร้าง');
            $table->char('delivered_by', 36)->nullable()->comment('ผู้ส่งของ');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            // Indexes
            $table->index('status');
            $table->index('delivery_method');
            $table->index('customer_id');
            $table->index('receipt_id');
            $table->index('tracking_number');
            $table->index('delivery_date');
            $table->index('created_at');
            
            // Foreign key constraints
            $table->foreign('receipt_id')->references('id')->on('receipts')->onDelete('set null');
            $table->foreign('customer_id')->references('cus_id')->on('master_customers')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_notes');
    }
};
