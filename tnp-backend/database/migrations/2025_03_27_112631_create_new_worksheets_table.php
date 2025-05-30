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
        Schema::create('new_worksheets', function (Blueprint $table) {
            $table->char('worksheet_id', 36)->primary()->comment('ไอดีตาราง 24ws_worksheets');
            $table->string('work_id', 20)->nullable()->comment('ไอดีใบงานสำหรับแสดงผล');
            $table->char('customer_id', 36)->nullable()->comment('ไอดีตาราง customers');
            $table->char('pattern_id', 36)->nullable()->comment('ไอดีตาราง 24ws_worksheet_shirt_patterns');
            $table->char('user_id', 36)->nullable()->comment('ไอดีตาราง users');
            $table->char('fabric_id', 36)->nullable()->comment('ไอดีตาราง 24ws_worksheet_fabrics');
            $table->char('screen_id', 36)->nullable()->comment('ไอดีตาราง 24ws_worksheet_screens');
            $table->string('work_name', 100)->nullable()->comment('ชื่องาน');
            $table->integer('total_quantity')->nullable();
            $table->date('due_date')->nullable()->comment('วันนัดส่งงาน');
            $table->date('exam_date')->nullable()->comment('วันนัดส่งตัวอย่าง');
            $table->timestamp('date_created')->nullable()->comment('วันสร้างใบงาน');
            $table->char('creator_name', 50)->nullable()->comment('ชื่อคนสร้างใบงาน');
            $table->char('manager_name', 50)->nullable()->comment('ชื่อผู้จัดการ');
            $table->char('production_name', 50)->nullable()->comment('ชื่อฝ่ายผลิต');
            $table->string('images')->nullable()->comment('รูปเสื้อ');
            $table->text('worksheet_note')->nullable()->default('')->comment('บันทึกข้อมูลใบงาน');
            $table->text('worksheet_edit_detail')->nullable()->comment('รายละเอียดขอแก้ไขใบงาน');
            $table->enum('type_shirt', ['t-shirt', 'polo-shirt'])->nullable()->comment('ประเภทเสื้อ');
            $table->text('shirt_detail')->nullable()->comment('รายละเอียดเสื้อ');
            $table->boolean('size_tag')->nullable()->comment('ติดป้ายไซซ์');
            $table->string('packaging', 100)->nullable()->comment('แพคเกจใส่เสื้อ');
            $table->tinyInteger('deleted')->default(0)->comment('1=deleted');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('new_worksheets');
    }
};
