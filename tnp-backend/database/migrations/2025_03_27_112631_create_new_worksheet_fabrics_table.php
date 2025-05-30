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
        Schema::create('new_worksheet_fabrics', function (Blueprint $table) {
            $table->char('fabric_id', 36)->primary()->comment('ไอดีตาราง 24ws_worksheet_fabrics');
            $table->char('worksheet_id', 36)->nullable()->comment('ไอดีตาราง 24ws_worksheets');
            $table->string('fabric_name', 100)->nullable()->comment('ชื่อผ้า');
            $table->string('fabric_no', 50)->nullable()->comment('เบอร์ผ้า');
            $table->string('fabric_color', 100)->nullable()->comment('สีผ้า');
            $table->string('fabric_color_no', 100)->nullable()->comment('เบอร์สีผ้า');
            $table->string('fabric_factory', 100)->nullable();
            $table->string('crewneck_color', 100)->nullable()->comment('บุ๊งคอ');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('new_worksheet_fabrics');
    }
};
