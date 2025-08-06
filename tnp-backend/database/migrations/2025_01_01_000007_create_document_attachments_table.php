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
        Schema::create('document_attachments', function (Blueprint $table) {
            $table->comment('ตารางเก็บไฟล์แนบเอกสาร');
            
            // Primary key
            $table->char('id', 36)->primary()->default(\DB::raw('(UUID())'));
            
            // Document reference
            $table->enum('document_type', ['quotation', 'invoice', 'receipt', 'delivery_note'])
                  ->comment('ประเภทเอกสาร');
            $table->char('document_id', 36)->comment('ID ของเอกสาร');
            
            // File information
            $table->string('filename', 255)->comment('ชื่อไฟล์ในระบบ');
            $table->string('original_filename', 255)->comment('ชื่อไฟล์เดิม');
            $table->string('file_path', 500)->comment('path ของไฟล์');
            $table->integer('file_size')->nullable()->comment('ขนาดไฟล์ (bytes)');
            $table->string('mime_type', 100)->nullable()->comment('ประเภทไฟล์');
            
            // Audit fields
            $table->char('uploaded_by', 36)->nullable()->comment('ผู้อัปโหลด');
            $table->timestamp('created_at')->useCurrent();
            
            // Indexes
            $table->index(['document_type', 'document_id']);
            $table->index('uploaded_by');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_attachments');
    }
};
