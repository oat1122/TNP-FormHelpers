<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('encouraging_messages', function (Blueprint $table) {
            $table->comment('ตารางข้อความให้กำลังใจ');
            $table->char('em_id', 36)->default('uuid()')->primary();
            $table->text('em_content')->comment('เนื้อหาข้อความให้กำลังใจ');
            $table->string('em_category', 50)->nullable()->comment('หมวดหมู่ข้อความ');
            $table->boolean('em_is_active')->default(true)->comment('สถานะการใช้งาน');
            $table->dateTime('em_created_date')->nullable()->comment('วันที่สร้าง');
            $table->char('em_created_by', 36)->nullable()->comment('ผู้สร้าง');
            $table->dateTime('em_updated_date')->nullable()->comment('วันที่แก้ไข');
            $table->char('em_updated_by', 36)->nullable()->comment('ผู้แก้ไข');
        });
        
        // Insert initial encouraging messages
        DB::table('encouraging_messages')->insert([
            [
                'em_id' => '951279db-098a-11f0-b223-38ca84abdf0a',
                'em_content' => 'ขอบคุณสำหรับข้อเสนอแนะที่มีค่า เราจะนำไปปรับปรุงให้ดียิ่งขึ้น!',
                'em_category' => 'feedback',
                'em_is_active' => true,
                'em_created_date' => now(),
            ],
            [
                'em_id' => '951279f9-098a-11f0-b223-38ca84abdf0a',
                'em_content' => 'เราเข้าใจความรู้สึกของคุณ และกำลังพยายามแก้ไขปัญหาให้ดีที่สุด',
                'em_category' => 'complaint',
                'em_is_active' => true,
                'em_created_date' => now(),
            ],
            [
                'em_id' => '95127a0d-098a-11f0-b223-38ca84abdf0a',
                'em_content' => 'ความคิดเห็นของคุณมีค่าต่อเรามาก และจะช่วยให้เราพัฒนาไปด้วยกัน',
                'em_category' => 'general',
                'em_is_active' => true,
                'em_created_date' => now(),
            ],
            [
                'em_id' => '95127a2b-098a-11f0-b223-38ca84abdf0a',
                'em_content' => 'เราเชื่อว่าทุกปัญหามีทางออก เราจะช่วยหาทางออกที่ดีที่สุดให้คุณ',
                'em_category' => 'problem',
                'em_is_active' => true,
                'em_created_date' => now(),
            ],
            [
                'em_id' => '95127a3f-098a-11f0-b223-38ca84abdf0a',
                'em_content' => 'วันนี้อาจเจอปัญหา แต่พรุ่งนี้จะดีขึ้นเสมอ เราพร้อมก้าวไปด้วยกัน',
                'em_category' => 'motivation',
                'em_is_active' => true,
                'em_created_date' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('encouraging_messages');
    }
};
