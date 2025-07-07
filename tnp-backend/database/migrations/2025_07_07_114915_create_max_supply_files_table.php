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
        Schema::create('max_supply_files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('max_supply_id'); // เชื่อมกับ max_supplies
            $table->string('original_name'); // ชื่อไฟล์เดิม
            $table->string('stored_name'); // ชื่อไฟล์ที่เก็บในระบบ
            $table->string('file_path'); // path ของไฟล์
            $table->string('file_type'); // ประเภทไฟล์ (image, document, etc.)
            $table->string('mime_type'); // MIME type
            $table->bigInteger('file_size'); // ขนาดไฟล์ (bytes)
            $table->text('description')->nullable(); // คำอธิบายไฟล์
            $table->unsignedBigInteger('uploaded_by'); // ผู้อัปโหลด
            $table->timestamps();
            
            // Indexes
            $table->index(['max_supply_id', 'file_type']);
            $table->index(['uploaded_by', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('max_supply_files');
    }
};
