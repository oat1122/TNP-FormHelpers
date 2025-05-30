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
        Schema::create('new_worksheet_status', function (Blueprint $table) {
            $table->char('status_id', 36)->primary()->comment('ไอดีตาราง 24ws_worksheet_status');
            $table->char('worksheet_id', 36)->nullable()->comment('ไอดีตาราง 24ws_worksheets');
            $table->integer('sales')->default(0)->comment('0=ใบงานถูกสร้าง, 1=ยืนยันใบงาน, 2=ขอสิทธิ์แก้ไขใบงาน, 3=แก้ไขใบงาน');
            $table->integer('manager')->default(0)->comment('0=ใบงานถูกสร้าง, 1=ยืนยันใบงาน');
            $table->dateTime('sales_confirm_date')->nullable()->comment('วันที่เซลยืนยันใบงาน');
            $table->dateTime('manager_confirm_date')->nullable()->comment('วันที่ผู้จัดการยืนยันใบงาน');
            $table->dateTime('sales_permission_date')->nullable()->comment('วันที่เซลขอแก้ไขใบงาน');
            $table->dateTime('manager_approve_date')->nullable()->comment('วันที่ผู้จัดการอนุมัติแก้ไขใบงาน');
            $table->dateTime('sales_edit_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('new_worksheet_status');
    }
};
