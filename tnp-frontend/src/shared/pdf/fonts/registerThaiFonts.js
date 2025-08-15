// src/shared/pdf/fonts/registerThaiFonts.js
import { Font } from '@react-pdf/renderer';

let done = false;

/**
 * ลงทะเบียนฟอนต์ไทยสำหรับ @react-pdf/renderer
 * - ใช้ .ttf จาก public/fonts/Sarabun/
 * - ปิด hyphenation เพื่อกันการตัดคำไทยผิด
 */
export async function ensureThaiFontsRegisteredAsync() {
  if (done) return;

  // ปิดการตัดคำ (กันวรรณยุกต์หลุด/แตกคำกลางคำ)
  Font.registerHyphenationCallback((word) => [word]);

  // ฟอนต์หลัก: Sarabun (มดวางไฟล์ไว้ใน public/fonts/Sarabun)
  Font.register({
    family: 'Sarabun',
    fonts: [
      { src: '/fonts/Sarabun/Sarabun-Regular.ttf', fontWeight: 'normal' },
      { src: '/fonts/Sarabun/Sarabun-Bold.ttf',    fontWeight: 'bold' },
      // ถ้าต้องการเพิ่มน้ำหนักอื่นๆ เช่น Medium/Italic ให้ใส่เพิ่มตรงนี้ได้
    ],
  });

  done = true;
}
