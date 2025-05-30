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
        Schema::create('new_worksheet_example_qty', function (Blueprint $table) {
            $table->char('ex_id', 36)->primary()->comment('ไอดีตาราง 24ws_worksheet_example_qty');
            $table->char('worksheet_id', 36)->nullable()->comment('ไอดีตาราง 24ws_worksheets');
            $table->tinyInteger('ex_pattern_type')->nullable()->comment('1=unisex, 2=men, 3=women');
            $table->string('ex_size_name', 10)->nullable()->comment('ชื่อไซซ์เสื้อตัวอย่าง');
            $table->integer('ex_quantity')->nullable()->comment('จำนวนเสื้อตัวอย่างตามไซซ์');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('new_worksheet_example_qty');
    }
};
