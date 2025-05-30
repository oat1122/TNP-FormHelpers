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
        Schema::create('new_worksheet_polo_details', function (Blueprint $table) {
            $table->char('polo_detail_id', 36)->primary()->comment('ไอดีตาราง 24ws_worksheet_polo_details');
            $table->char('worksheet_id', 36)->nullable()->comment('ไอดีตาราง 24ws_worksheets');
            $table->tinyInteger('collar')->nullable()->comment('1=คอปก, 2=คอจีน, 3=ปกเชิ้ต');
            $table->tinyInteger('collar_type')->nullable()->comment('1=ปกธรรมดา, 2=ปกทอ/ขลิบปก, 3=ปกเจ็กการ์ด, 4=ปกเชิ้ต, 0=อื่นๆ');
            $table->string('other_collar_type', 100)->nullable()->comment('ชนิดคอปกอื่นๆ');
            $table->text('collar_type_detail')->nullable()->comment('รายละเอียดชนิดปกคอ');
            $table->tinyInteger('placket')->nullable()->comment('1=สาปปกติ, 2=สาปโชว์, 3=สาปแลป, 0=อื่นๆ');
            $table->string('other_placket', 100)->nullable()->comment('ชื่อรูปแบบสาปอื่นๆ');
            $table->boolean('outer_placket')->nullable()->comment('สาปนอก');
            $table->text('outer_placket_detail')->nullable()->comment('รายละเอียดสาปนอก');
            $table->boolean('inner_placket')->nullable()->comment('สาปนอก');
            $table->text('inner_placket_detail')->nullable()->comment('รายละเอียดสาปใน');
            $table->tinyInteger('button')->nullable()->comment('1=2เม็ด, 2=3เม็ด, 0=อื่นๆ');
            $table->string('other_button', 100)->nullable()->comment('ชื่อรูปแบบกระดุมอื่นๆ');
            $table->string('button_color', 100)->nullable()->comment('สีกระดุม');
            $table->tinyInteger('sleeve')->nullable()->comment('1=แขนปล่อย, 2=แขนซ้อน/แขนเบิล, 3=แขนจั๊มรอบ, 4=แขนจั๊มครึ่ง');
            $table->text('sleeve_detail')->nullable()->comment('รายละเอียดแขนเสื้อ');
            $table->tinyInteger('pocket')->nullable()->comment('1=กระเป๋าโชว์, 2=กระเป๋าเจาะ, 3=ไม่มีกระเป๋า');
            $table->text('pocket_detail')->nullable()->comment('รายละเอียดกระเป๋า');
            $table->boolean('bottom_hem')->nullable()->comment('ชายซ้อน');
            $table->text('bottom_hem_detail')->nullable()->comment('รายละเอียดชายซ้อน');
            $table->boolean('back_seam')->nullable()->comment('วงพระจันทร์');
            $table->text('back_seam_detail')->nullable()->comment('รายละเอียดวงพระจันทร์');
            $table->boolean('side_vents')->nullable()->comment('ผ่าข้างชายเสื้อ');
            $table->text('side_vents_detail')->nullable()->comment('รายละเอียดผ่าข้างชายเสื้อ');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('new_worksheet_polo_details');
    }
};
