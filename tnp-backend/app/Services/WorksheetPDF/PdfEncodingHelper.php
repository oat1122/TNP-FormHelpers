<?php

namespace App\Services\WorksheetPDF;

/**
 * Trait PdfEncodingHelper
 *
 * Trait นี้มีฟังก์ชันสำหรับช่วยแปลงข้อความสำหรับใช้ใน PDF (FPDF)
 * เพื่อป้องกัน Error "iconv(): Detected an illegal character in input string"
 * โดยจะทำการตัด (IGNORE) ตัวอักษรที่ไม่รองรับใน TIS-620 ออกไปอัตโนมัติ
 */
trait PdfEncodingHelper
{
    /**
     * แปลง string เป็น TIS-620 อย่างปลอดภัยสำหรับใช้ใน PDF
     *
     * @param mixed $text ข้อความที่ต้องการแปลง (รองรับ null หรือตัวเลข โดยจะถูกแปลงเป็น string)
     * @param string $to Encoding ปลายทาง (TIS-620)
     * @param string $from Encoding ต้นทาง (UTF-8)
     * @return string ข้อความที่แปลงแล้วและปลอดภัย
     */
    public function safeIconv($text, $to = 'TIS-620', $from = 'UTF-8')
    {
        // 1. แปลง input เป็น string เสมอ เพื่อป้องกัน error หาก $text เป็น null
        $text = (string) $text;
        
        // 2. ใช้ //IGNORE เพื่อตัดตัวอักษรที่แปลงไม่ได้ทิ้งไปเลย
        return iconv($from, $to . '//IGNORE', $text);
    }
}
