# Invoice Multi-Header PDF Download

เพิ่มความสามารถให้ผู้ใช้เลือกหลายประเภทหัวกระดาษก่อนดาวน์โหลดใบแจ้งหนี้ (Laravel 10 + React + MUI 7.2.0)

## รายละเอียดฟีเจอร์
- ปุ่ม "ดาวน์โหลด PDF" บนการ์ด Invoice เปิดเมนูเลือกประเภทหัวกระดาษ (multi-select)
- ค่าให้เลือกมาตรฐาน: `ต้นฉบับ`, `สำเนา`, `สำเนา-ลูกค้า`
- ถ้าเอกสารมี `document_header_type` กำหนดเอง และไม่ซ้ำกับรายการมาตรฐาน จะถูกเพิ่มอัตโนมัติ
- เลือกได้ 1 รายการ: ส่งคืน JSON meta พร้อม URL (ไฟล์ PDF เดี่ยว)
- เลือกมากกว่า 1 รายการ: Backend สร้างหลาย PDF แล้ว bundle เป็น `.zip` (คืน zip_url + รายการไฟล์ย่อย)
- ไม่แก้ไข column หรือ schema ใด ๆ ของตาราง `invoices`

## Backend (API)
Endpoint: `POST /api/v1/invoices/{id}/generate-pdf`
Body ตัวอย่าง:
```
{
  "headerTypes": ["ต้นฉบับ", "สำเนา", "สำเนา-ลูกค้า"],
  "showWatermark": false
}
```
ผลลัพธ์ (หลายไฟล์):
```
{
  "success": true,
  "mode": "zip",
  "zip_url": "https://.../storage/pdfs/invoices/zips/invoice-INV-1001-multi-20250910....zip",
  "files": [ {"type":"ต้นฉบับ","filename":"...pdf"}, ... ]
}
```

Single:
```
{
  "success": true,
  "mode": "single",
  "pdf_url": "https://.../storage/pdfs/invoices/invoice-INV-1001-...pdf"
}
```

## Implementation Notes
- ไม่แก้ไขข้อมูลใน DB: ใช้ runtime override ผ่าน option `document_header_type`
- ชื่อไฟล์ PDF แต่ละหัวกระดาษ: `invoice-{number}-{slug(header)}-{timestamp}.pdf`
- Zip ถูกเก็บที่: `storage/app/public/pdfs/invoices/zips`
- ใช้ `ZipArchive` มาตรฐาน PHP

## Frontend
- Component: `InvoiceCard.jsx` เพิ่มเมนู MUI `<Menu>` พร้อม `<Checkbox>`
- ส่ง callback `onDownloadPDF({ invoiceId, headerTypes })`
- ปุ่มแสดงข้อความ `(PDF)` หรือ `(.zip)` ตามจำนวนที่เลือก

## ต่อไป (Next Steps แนะนำ)
- เพิ่ม progress indicator ระหว่างรอ zip
- บันทึก history การดาวน์โหลดหลายหัวกระดาษ (action_type ใหม่ เช่น `generate_pdf_multi`)
- เพิ่ม validation รายการหัวกระดาษ whitelist กลาง (config)
- Caching: ถ้าสร้าง zip เดิมภายในช่วงเวลาหนึ่ง (เช่น 10 นาที) reuse ได้

---
อัปเดต: 2025-09-10
