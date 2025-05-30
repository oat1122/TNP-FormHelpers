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
        Schema::create('master_product_categories', function (Blueprint $table) {
            $table->comment('ตารางประเภทสินค้า');
            $table->char('mpc_id', 36)->default('uuid()')->primary();
            $table->string('mpc_name', 100)->nullable()->comment('ชื่อประเภทสินค้า');
            $table->text('mpc_remark')->nullable()->comment('รายละเอียดประเภทสินค้า');
            $table->boolean('mpc_is_deleted')->default(false)->comment('สถานะการลบ');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_product_categories');
    }
};
