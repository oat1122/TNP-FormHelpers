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
        Schema::create('order_items_tracking', function (Blueprint $table) {
            $table->comment('ตารางติดตามจำนวนคงเหลือสินค้า');
            
            // Primary key
            $table->char('id', 36)->primary()->default(\DB::raw('(UUID())'));
            
            // Foreign Keys
            $table->char('quotation_id', 36)->nullable()->comment('อ้างอิงถึง quotations.id');
            $table->char('pricing_request_id', 36)->nullable()->comment('อ้างอิงถึง pricing_requests.pr_id');
            
            // ข้อมูลสินค้าที่ autofill จาก pricing_requests
            $table->string('work_name', 100)->nullable()->comment('ชื่องาน');
            $table->string('fabric_type', 255)->nullable()->comment('ชนิดผ้า');
            $table->string('pattern', 255)->nullable()->comment('แพทเทิร์น');
            $table->string('color', 255)->nullable()->comment('สีสินค้า');
            $table->string('sizes', 255)->nullable()->comment('ไซซ์');
            
            // จำนวนสินค้า
            $table->integer('ordered_quantity')->default(0)->comment('จำนวนที่สั่ง');
            $table->integer('delivered_quantity')->default(0)->comment('จำนวนที่ส่งแล้ว');
            $table->integer('remaining_quantity')->storedAs('ordered_quantity - delivered_quantity')->comment('จำนวนคงเหลือ');
            $table->integer('returned_quantity')->default(0)->comment('จำนวนที่คืน');
            
            // ราคา
            $table->decimal('unit_price', 10, 2)->default(0)->comment('ราคาต่อหน่วย');
            
            // Audit fields
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            // Indexes
            $table->index('quotation_id');
            $table->index('pricing_request_id');
            $table->index('remaining_quantity');
            
            // Foreign key constraints
            $table->foreign('quotation_id')->references('id')->on('quotations')->onDelete('cascade');
            $table->foreign('pricing_request_id')->references('pr_id')->on('pricing_requests')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items_tracking');
    }
};
