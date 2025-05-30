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
        Schema::create('cost_fabrics', function (Blueprint $table) {
            $table->bigIncrements('cost_fabric_id');
            $table->bigInteger('pattern_id');
            $table->char('fabric_name', 100);
            $table->char('fabric_name_tnp', 100)->nullable();
            $table->char('supplier', 100)->nullable();
            $table->enum('fabric_class', ['R', 'P', 'PR']);
            $table->double('fabric_kg', 8, 2)->nullable()->comment('	จำนวนผ้า (กิโลกรัม)');
            $table->double('fabric_price_per_kg', 8, 2)->nullable();
            $table->integer('shirt_per_total')->nullable()->comment('จำนวนเสื้อที่ตัดได้จากผ้าทั้งหมด');
            $table->integer('shirt_per_kg')->nullable();
            $table->double('cutting_price', 8, 2)->nullable()->default(0);
            $table->double('sewing_price', 8, 2)->nullable();
            $table->integer('collar_kg')->nullable()->comment('ราคาบุ้งคอต่อกิโลกรัม');
            $table->integer('collar_price')->nullable()->comment('ราคาปกคอ');
            $table->integer('button_price')->nullable()->comment('ราคากระดุม');
            $table->integer('shirt_price_percent')->nullable()->comment('เปอร์เซ็นต์กำไรราคาเสื้อ');
            $table->integer('shirt_1k_price_percent')->nullable()->comment('เปอร์เซ็นต์กำไรราคาเสื้อขั้นต่ำ 1000 ตัว');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cost_fabrics');
    }
};
