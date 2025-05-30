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
        Schema::create('new_worksheet_fabric_customs', function (Blueprint $table) {
            $table->char('fabric_custom_id', 36)->primary()->comment('ไอดีตาราง 24ws_worksheet_fabric_customs');
            $table->char('fabric_id', 36)->nullable()->comment('ไอดีตาราง 24ws_worksheet_fabrics');
            $table->string('fabric_custom_color', 100)->nullable()->comment('สีผ้าส่วนบุ๊งคอ');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('new_worksheet_fabric_customs');
    }
};
