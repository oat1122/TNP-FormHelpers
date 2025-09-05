<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // อัพเดท inv_manage_by ของ invoices ที่มีอยู่แล้วให้ตรงกับ created_by ของ quotation ที่เกี่ยวข้อง
        DB::statement("
            UPDATE invoices i 
            JOIN quotations q ON i.quotation_id = q.id 
            SET i.inv_manage_by = q.created_by 
            WHERE i.quotation_id IS NOT NULL 
            AND i.inv_manage_by IS NULL 
            AND q.created_by IS NOT NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // ไม่ต้องทำอะไร - เราไม่ต้องการลบข้อมูลที่อัพเดทแล้ว
        // เพราะมันเป็นข้อมูลที่ถูกต้องและมีประโยชน์
    }
};
