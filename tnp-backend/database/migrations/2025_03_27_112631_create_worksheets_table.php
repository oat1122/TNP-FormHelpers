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
        Schema::create('worksheets', function (Blueprint $table) {
            $table->increments('sheetID');
            $table->string('work_id', 20)->index('work_id')->comment('ไอดีใบงานสำหรับแสดงผล');
            $table->integer('customer_id')->index('customer_id')->comment('ไอดีตารางลูกค้า');
            $table->integer('pattern_id')->index('c_pattern_id')->comment('ไอดีตารางแพทเทิร์นเสื้อ');
            $table->integer('ex_id')->index('ex_id')->comment('ไอดีตารางจำนวนเสื้อตัวอย่าง');
            $table->integer('user_id')->index('user_id')->comment('ไอดีผู้ขายงาน');
            $table->string('work_name', 100)->comment('ชื่องาน');
            $table->dateTime('create_sheet_1')->useCurrent()->comment('วันที่สร้างใบงาน');
            $table->date('create_sheet_2');
            $table->string('fabric', 100)->comment('ชื่อผ้า');
            $table->string('no_fabric', 100)->comment('เบอร์ผ้า');
            $table->string('color', 100)->comment('สีผ้า');
            $table->string('no_color', 100)->comment('เบอร์สีผ้า');
            $table->string('fact_fabric', 100)->comment('ชื่อโรงงานผ้า');
            $table->integer('quantity')->comment('จำนวนรวมสินค้า');
            $table->integer('exam_quantity')->comment('จำนวนตัวอย่างสินค้า');
            $table->integer('size_sss')->comment('จำนวนเสื้อไซซ์ sss');
            $table->integer('size_ss')->comment('จำนวนเสื้อไซซ์ ss');
            $table->integer('size_s')->comment('จำนวนเสื้อไซซ์ s');
            $table->integer('size_m')->comment('จำนวนเสื้อไซซ์ m');
            $table->integer('size_l')->comment('จำนวนเสื้อไซซ์ L');
            $table->integer('size_xl')->comment('จำนวนเสื้อไซซ์ XL');
            $table->integer('size_2xl')->comment('จำนวนเสื้อไซซ์ 2XL');
            $table->integer('size_3xl')->comment('จำนวนเสื้อไซซ์ 3XL');
            $table->integer('size_4xl')->comment('จำนวนเสื้อไซซ์ 4XL');
            $table->integer('size_5xl')->comment('จำนวนเสื้อไซซ์ 5XL');
            $table->integer('size_6xl')->comment('จำนวนเสื้อไซซ์ 6XL');
            $table->integer('size_7xl')->comment('จำนวนเสื้อไซซ์ 6XL');
            $table->integer('screen_point')->comment('จำนวนจุดสกรีน');
            $table->integer('screen_flex')->comment('จำนวนจุดเฟลกซ์สกรีน');
            $table->integer('screen_dft')->comment('จำนวนจุด dft');
            $table->integer('screen_label')->comment('สกรีนลาเบล');
            $table->integer('screen_embroider')->comment('จำนวนจุดปัก');
            $table->date('exam_date')->nullable()->comment('วันที่นัดส่งตัวอย่าง');
            $table->date('due_date')->comment('วันที่นัดส่งงาน');
            $table->enum('creator_name', ['Thung', 'Pear'])->nullable()->comment('ชื่อผู้สร้างใบงาน หรือกราฟิก');
            $table->enum('manager_name', ['Ying'])->nullable()->comment('ชื่อผู้จัดการ');
            $table->enum('production_name', ['Ice', 'Mon', 'Kluay', 'Ying'])->nullable()->comment('ชื่อฝ่ายผลิต');
            $table->string('picture')->comment('รูปลายสกรีน');
            $table->text('note')->nullable()->comment('หมายเหตุ');
            $table->enum('product_category', ['T-Shirt', 'Polo Shirt'])->nullable()->comment('ประเภทเสื้อ');
            $table->text('product_detail')->nullable()->comment('รายละเอียดสินค้า');
            $table->text('screen_detail')->nullable()->comment('รายละเอียดการสกรีน');
            $table->enum('size_tag', ['ติด', 'ไม่ติด'])->nullable()->comment('ป้ายไซซ์');
            $table->string('packaging', 100)->nullable()->comment('ถุงใส่เสื้อ');
            $table->integer('deleted')->default(0)->comment('1=deleted');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('worksheets');
    }
};
