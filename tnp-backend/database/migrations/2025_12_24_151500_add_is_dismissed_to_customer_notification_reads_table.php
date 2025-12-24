<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * เพิ่ม is_dismissed column เพื่อแยก read state จาก dismiss state
     * - read_at: เมื่อคลิกดู notification (เปลี่ยนเป็นสีเทา)
     * - is_dismissed: เมื่อกด X (ซ่อนถาวร)
     */
    public function up(): void
    {
        Schema::table('customer_notification_reads', function (Blueprint $table) {
            $table->boolean('is_dismissed')
                ->default(false)
                ->after('read_at')
                ->comment('Whether the notification is dismissed (hidden permanently)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_notification_reads', function (Blueprint $table) {
            $table->dropColumn('is_dismissed');
        });
    }
};
