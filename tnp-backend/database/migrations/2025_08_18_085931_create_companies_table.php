<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->char('id', 36)->primary()->default(DB::raw('(UUID())'));
            $table->string('name', 255)->comment('ชื่อย่อ/ชื่อที่ใช้แสดง');
            $table->string('legal_name', 255)->nullable()->comment('ชื่อจดทะเบียน');
            $table->string('branch', 255)->nullable()->comment('สาขา');
            $table->text('address')->nullable();
            $table->char('tax_id', 13)->nullable();
            $table->string('phone', 100)->nullable();
            $table->string('short_code', 20)->nullable()->comment('โค้ดสั้น เช่น TNP, TNP153');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['is_active']);
            $table->unique(['name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
