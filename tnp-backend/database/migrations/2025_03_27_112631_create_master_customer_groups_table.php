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
        Schema::create('master_customer_groups', function (Blueprint $table) {
            $table->char('mcg_id', 36)->default('uuid()')->primary();
            $table->string('mcg_name')->nullable()->comment('ชื่อกลุ่ม customer');
            $table->string('mcg_remark')->nullable()->comment('รายละเอียดกลุ่ม customer');
            $table->string('mcg_recall_default')->nullable()->comment('จำนวนวันและเวลาในการติดต่อลูกค้า');
            $table->tinyInteger('mcg_sort')->nullable()->comment('ลำดับของกลุ่ม');
            $table->boolean('mcg_is_use')->default(true);
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->timestamp('updated_at')->useCurrentOnUpdate()->nullable()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_customer_groups');
    }
};
