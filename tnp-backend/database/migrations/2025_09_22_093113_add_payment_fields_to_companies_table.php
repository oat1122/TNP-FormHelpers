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
        Schema::table('companies', function (Blueprint $table) {
            $table->string('account_name')->nullable()->comment('ชื่อบัญชี');
            $table->string('bank_name')->nullable()->comment('ชื่อธนาคาร');
            $table->string('account_number')->nullable()->comment('เลขบัญชี');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['account_name', 'bank_name', 'account_number']);
        });
    }
};
