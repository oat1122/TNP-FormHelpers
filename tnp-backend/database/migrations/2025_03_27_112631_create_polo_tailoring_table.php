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
        Schema::create('polo_tailoring', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('work_id', 20);
            $table->enum('collar', ['คอปก', 'คอจีน', 'คอวี']);
            $table->enum('collar_type', ['ปกธรรมดา', 'ปกทอ / ขลิบปก', 'ปกเจ็กการ์ด', 'ปกผ้าในตัว', 'ปกเชิ้ต', 'อื่นๆ'])->comment('ชนิดคอปก');
            $table->string('other_collar_type', 100)->comment('ชนิดคอปกอื่นๆ');
            $table->text('collar_type_d')->comment('รายละเอียดชนิดปกคอ');
            $table->enum('placket', ['สาปปกติ', 'สาปโชว์', 'สาปแลป', 'อื่นๆ']);
            $table->text('other_placket')->comment('ชื่อรูปแบบสาปอื่นๆ');
            $table->integer('outer_placket')->comment('สาปนอก');
            $table->text('outer_placket_d')->comment('รายละเอียดสาปนอก');
            $table->integer('inner_placket')->comment('สาปใน');
            $table->text('inner_placket_d')->comment('รายละเอียดสาปใน');
            $table->enum('button', ['2 เม็ด', '3 เม็ด', 'อื่นๆ']);
            $table->text('other_button')->comment('ชื่อรูปแบบกระดุมอื่นๆ');
            $table->string('button_color', 100);
            $table->enum('sleeve', ['แขนปล่อย', 'แขนซ้อน / แขนเบิล', 'แขนจั๊มรอบ', 'แขนจั๊มครึ่ง']);
            $table->text('sleeve_detail');
            $table->enum('pocket', ['กระเป๋าโชว์', 'กระเป๋าเจาะ', 'ไม่มีกระเป๋า']);
            $table->text('pocket_detail');
            $table->integer('bottom_hem')->comment('ชายซ้อน');
            $table->text('bottom_hem_d')->comment('รายละเอียดชายซ้อน');
            $table->integer('back_seam')->comment('วงพระจันทร์');
            $table->text('back_seam_d')->comment('รายละเอียดวงพระจันทร์');
            $table->integer('side_vents')->comment('ผ่าข้างชายเสื้อ');
            $table->text('side_vents_d')->comment('รายละเอียดผ่าข้างชายเสื้อ');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('polo_tailoring');
    }
};
