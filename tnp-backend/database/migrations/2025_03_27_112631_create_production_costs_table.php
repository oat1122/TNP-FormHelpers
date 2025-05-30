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
        Schema::create('production_costs', function (Blueprint $table) {
            $table->bigIncrements('cost_id');
            $table->bigInteger('pd_id');
            $table->char('fabric', 100)->nullable();
            $table->char('factory', 100)->nullable();
            $table->char('fabric_color', 100)->nullable();
            $table->float('quantity', null, 0)->unsigned()->nullable();
            $table->unsignedInteger('fabric_price')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_costs');
    }
};
