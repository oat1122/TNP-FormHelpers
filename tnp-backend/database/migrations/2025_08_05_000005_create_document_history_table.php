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
        Schema::create('document_history', function (Blueprint $table) {
            $table->comment('ตารางติดตามการเปลี่ยนแปลงสถานะเอกสาร');
            
            // Primary key
            $table->char('id', 36)->primary()->default(\DB::raw('(UUID())'));
            
            // Document reference
            $table->enum('document_type', ['quotation', 'invoice', 'receipt', 'delivery_note', 'credit_note', 'debit_note'])
                  ->comment('ประเภทเอกสาร');
            $table->char('document_id', 36)->comment('ID ของเอกสาร');
            
            // Status tracking
            $table->string('previous_status', 50)->nullable()->comment('สถานะเดิม');
            $table->string('new_status', 50)->nullable()->comment('สถานะใหม่');
            $table->string('action', 100)->nullable()->comment('การกระทำ');
            $table->text('notes')->nullable()->comment('หมายเหตุ');
            
            // Audit fields
            $table->char('action_by', 36)->nullable()->comment('ผู้ดำเนินการ');
            $table->timestamp('created_at')->useCurrent();
            
            // Indexes
            $table->index(['document_type', 'document_id']);
            $table->index('action_by');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_history');
    }
};
