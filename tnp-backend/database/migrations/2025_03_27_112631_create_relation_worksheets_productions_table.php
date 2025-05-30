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
        Schema::create('relation_worksheets_productions', function (Blueprint $table) {
            $table->char('rwp_id', 36)->primary();
            $table->bigInteger('rwp_pd_id')->nullable()->comment('ไอดีตาราง productions');
            $table->bigInteger('rwp_ws_id')->nullable()->comment('ไอดีตารางระบบใบงานเก่า');
            $table->char('rwp_new_ws_id', 36)->nullable()->comment('ไอดีตารางระบบใบงานใหม่');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('relation_worksheets_productions');
    }
};
