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
        Schema::create('quotations', function (Blueprint $table) {
            $table->comment('ตารางใบเสนอราคา');
            
            // Primary key
            $table->char('id', 36)->primary()->default(\DB::raw('(UUID())'));
            $table->string('number', 50)->unique()->comment('เลขที่ใบเสนอราคา');
            
            // Foreign Keys
            $table->char('pricing_request_id', 36)->nullable()->comment('อ้างอิงถึง pricing_requests.pr_id');
            $table->char('customer_id', 36)->nullable()->comment('อ้างอิงถึง master_customers.cus_id');
            
            // ข้อมูลลูกค้าที่ autofill จาก master_customers
            $table->string('customer_company', 255)->nullable()->comment('ชื่อบริษัทลูกค้า');
            $table->char('customer_tax_id', 13)->nullable()->comment('เลขประจำตัวผู้เสียภาษี');
            $table->text('customer_address')->nullable()->comment('ที่อยู่ลูกค้า');
            $table->char('customer_zip_code', 5)->nullable()->comment('รหัสไปรษณีย์');
            $table->string('customer_tel_1', 50)->nullable()->comment('เบอร์โทรศัพท์');
            $table->string('customer_email', 255)->nullable()->comment('อีเมล์');
            $table->string('customer_firstname', 100)->nullable()->comment('ชื่อ');
            $table->string('customer_lastname', 100)->nullable()->comment('นามสกุล');
            
            // ข้อมูลงานที่ autofill จาก pricing_requests
            $table->string('work_name', 100)->nullable()->comment('ชื่องาน');
            $table->string('fabric_type', 255)->nullable()->comment('ชนิดผ้า');
            $table->string('pattern', 255)->nullable()->comment('แพทเทิร์น');
            $table->string('color', 255)->nullable()->comment('สีสินค้า');
            $table->string('sizes', 255)->nullable()->comment('ไซซ์');
            $table->string('quantity', 10)->nullable()->comment('จำนวน');
            $table->string('silk_screen', 255)->nullable()->comment('silk screen');
            $table->string('dft_screen', 255)->nullable()->comment('dft screen');
            $table->string('embroider', 255)->nullable()->comment('งานปัก');
            $table->string('sub_screen', 255)->nullable()->comment('sub screen');
            $table->string('other_screen', 255)->nullable()->comment('งานพิมพ์อื่นๆ');
            $table->string('product_image', 500)->nullable()->comment('รูปภาพสินค้า');
            
            // สถานะและเงื่อนไข
            $table->enum('status', ['draft', 'pending_review', 'approved', 'rejected', 'sent', 'completed'])
                  ->default('draft')->comment('สถานะใบเสนอราคา');
            $table->decimal('subtotal', 15, 2)->default(0)->comment('ราคาก่อนภาษี');
            $table->decimal('tax_amount', 15, 2)->default(0)->comment('จำนวนภาษี');
            $table->decimal('total_amount', 15, 2)->default(0)->comment('ราคารวม');
            $table->integer('deposit_percentage')->default(0)->comment('เปอร์เซ็นต์เงินมัดจำ');
            $table->decimal('deposit_amount', 15, 2)->default(0)->comment('จำนวนเงินมัดจำ');
            $table->string('payment_terms', 50)->nullable()->comment('เงื่อนไขการชำระเงิน');
            $table->date('due_date')->nullable()->comment('วันครบกำหนด');
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
            $table->index('pricing_request_id');
            $table->index('created_at');
            $table->index('due_date');
            
            // Foreign key constraints - temporarily disabled due to existing table structure
            // $table->foreign('pricing_request_id')->references('pr_id')->on('pricing_requests')->onDelete('set null');
            // $table->foreign('customer_id')->references('cus_id')->on('master_customers')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
