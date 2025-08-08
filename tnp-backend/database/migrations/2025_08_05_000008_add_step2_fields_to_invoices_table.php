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
        Schema::table('invoices', function (Blueprint $table) {
            // เพิ่มฟิลด์สำหรับ Step 2 Invoice workflow
            $table->enum('type', ['full_amount', 'remaining', 'deposit', 'partial'])
                  ->default('full_amount')->comment('ประเภทการเรียกเก็บ')
                  ->after('status');
            
            $table->string('payment_terms', 100)->nullable()
                  ->comment('เงื่อนไขการชำระ')
                  ->after('payment_method');
            
            // ฟิลด์สำหรับติดตามการส่ง
            $table->char('submitted_by', 36)->nullable()->comment('ผู้ส่งขออนุมัติ')->after('created_by');
            $table->timestamp('submitted_at')->nullable()->comment('วันที่ส่งขออนุมัติ')->after('submitted_by');
            
            $table->char('rejected_by', 36)->nullable()->comment('ผู้ปฏิเสธ')->after('approved_at');
            $table->timestamp('rejected_at')->nullable()->comment('วันที่ปฏิเสธ')->after('rejected_by');
            
            $table->char('sent_by', 36)->nullable()->comment('ผู้ส่งให้ลูกค้า')->after('rejected_at');
            $table->timestamp('sent_at')->nullable()->comment('วันที่ส่งให้ลูกค้า')->after('sent_by');
            
            $table->timestamp('paid_at')->nullable()->comment('วันที่ชำระครบ')->after('sent_at');
            
            // เพิ่ม index
            $table->index('type');
            $table->index('submitted_at');
            $table->index('sent_at');
            $table->index('paid_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropIndex(['submitted_at']);
            $table->dropIndex(['sent_at']);
            $table->dropIndex(['paid_at']);
            
            $table->dropColumn([
                'type',
                'payment_terms',
                'submitted_by',
                'submitted_at',
                'rejected_by',
                'rejected_at',
                'sent_by',
                'sent_at',
                'paid_at'
            ]);
        });
    }
};
