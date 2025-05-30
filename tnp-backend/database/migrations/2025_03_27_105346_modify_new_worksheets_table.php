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
        Schema::table('new_worksheets', function (Blueprint $table) {
            $table->boolean('nws_is_deleted')->default(false)->comment('สถานะการลบ')->after('deleted');
            $table->timestamp('nws_created_date')->nullable()->useCurrent()->comment('วันที่สร้างข้อมูล');
            $table->uuid('nws_created_by')->nullable()->comment('คนสร้างข้อมูล');
            $table->timestamp('nws_updated_date')->nullable()->useCurrent()->useCurrentOnUpdate()->comment('วันที่อัปเดตข้อมูล');
            $table->uuid('nws_updated_by')->nullable()->comment('คนอัปเดตข้อมูล');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
