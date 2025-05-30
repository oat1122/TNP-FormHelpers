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
        Schema::create('productions', function (Blueprint $table) {
            $table->bigIncrements('pd_id');
            $table->unsignedBigInteger('work_id')->nullable()->comment('ไอดีตาราง worksheets');
            $table->char('new_worksheet_id', 36)->nullable()->comment('ไอดีตาราง 24ws_worksheets');
            $table->integer('production_type')->nullable();
            $table->integer('screen')->nullable();
            $table->integer('dft')->nullable();
            $table->integer('embroid')->nullable();
            $table->date('order_start')->nullable();
            $table->date('order_end')->nullable();
            $table->date('dyeing_start')->nullable();
            $table->date('dyeing_end')->nullable();
            $table->dateTime('cutting_start')->nullable();
            $table->dateTime('cutting_end')->nullable();
            $table->dateTime('sewing_start')->nullable();
            $table->dateTime('sewing_end')->nullable();
            $table->date('received_start')->nullable();
            $table->date('received_end')->nullable();
            $table->date('exam_start')->nullable()->comment('วันที่เริ่มทำตัวอย่างเสื้อ');
            $table->date('exam_end')->nullable()->comment('วันที่ตัวอย่างเสื้อเสร็จ');
            $table->integer('cutting_factory')->nullable();
            $table->integer('sewing_factory')->nullable();
            $table->integer('status')->nullable()->default(0);
            $table->timestamp('end_select_process_time')->nullable()->comment('วันสิ้นสุดการเริ่มต้นระบบงาน');
            $table->timestamp('created_at')->useCurrentOnUpdate()->nullable()->useCurrent();
            $table->timestamp('updated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('productions');
    }
};
