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
        Schema::table('max_supplies', function (Blueprint $table) {
            $table->json('work_calculations')->nullable()->comment('การคำนวณงานแต่ละประเภทการพิมพ์ {"screen": {"points": 2, "total_work": 200}, "dtf": {...}}');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('max_supplies', function (Blueprint $table) {
            $table->dropColumn('work_calculations');
        });
    }
};
