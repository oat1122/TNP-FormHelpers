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
        Schema::create('quotation_pricing_requests', function (Blueprint $table) {
            $table->comment('ตารางเชื่อมโยง Quotation กับ Pricing Requests (Many-to-Many)');
            
            // Primary key
            $table->char('id', 36)->primary()->default(\DB::raw('(UUID())'));
            
            // Foreign Keys
            $table->char('quotation_id', 36)->comment('อ้างอิงถึง quotations.id');
            $table->char('pricing_request_id', 36)->comment('อ้างอิงถึง pricing_requests.pr_id');
            
            // Metadata
            $table->integer('sequence_order')->default(1)->comment('ลำดับของ pricing request ใน quotation');
            $table->decimal('allocated_amount', 12, 2)->nullable()->comment('จำนวนเงินที่จัดสรรให้ pricing request นี้');
            $table->integer('allocated_quantity')->nullable()->comment('จำนวนสินค้าที่จัดสรรให้ pricing request นี้');
            
            // Timestamps
            $table->timestamp('created_at')->useCurrent()->comment('วันที่สร้าง');
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate()->comment('วันที่อัปเดต');
            $table->char('created_by', 36)->nullable()->comment('ผู้สร้าง');
            
            // Indexes
            $table->index(['quotation_id', 'pricing_request_id'], 'idx_quotation_pricing_composite');
            $table->index('quotation_id', 'idx_quotation_pricing_quotation');
            $table->index('pricing_request_id', 'idx_quotation_pricing_request');
            
            // Unique constraint - หนึ่ง pricing request ต่อหนึ่ง quotation
            $table->unique(['quotation_id', 'pricing_request_id'], 'uniq_quotation_pricing_request');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_pricing_requests');
    }
};
