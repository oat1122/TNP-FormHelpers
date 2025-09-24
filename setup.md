ได้เลย Oat—นี่คือ **พรอมต์สั้น กระชับ ทีละสเต็ป** สำหรับสั่ง AI/โค้ดเจน “สร้างหน้า Receipts” ให้ครบวงจร (Laravel 10 + React + MUI 7.x) เอาไปวางแล้วรันตามได้ทันที

---

# คุณคือ Full-Stack Dev (Laravel 10 + React + MUI 7.x) โฟกัสคุณภาพระดับโปร

เป้าหมาย: สร้าง **หน้า Receipts** ครบ CRUD + ดูรายละเอียด + พิมพ์ PDF + ไฟล์แนบ + ประวัติเอกสาร โดย **อ้างอิงยอด/รายการจาก invoices/invoice\_items** และรันเลขจาก document\_sequences

## 0) โครงไฟล์ (ห้ามทับซ้อนโมดูลอื่น)

**Backend**

* `app/Models/Receipt.php`
* `app/Http/Controllers/Accounting/ReceiptController.php`
* `app/Http/Requests/ReceiptStoreRequest.php`, `ReceiptUpdateRequest.php`
* `app/Services/Accounting/ReceiptService.php` (create, numbering, snapshot, attachments, history)
* `app/Services/Accounting/Pdf/ReceiptPdfService.php`
* `routes/api.php` (prefix `/api/receipts`)
* Policy: `app/Policies/ReceiptPolicy.php`
* Migration: `database/migrations/**_create_receipts_table.php`

**Frontend**

* `tnp-frontend/src/pages/Accounting/Receipts/ReceiptsPage.jsx`
* `.../Receipts/components/ReceiptList.jsx`, `ReceiptCard.jsx`, `ReceiptDetailDialog.jsx`, `ReceiptCreateDialog.jsx`
* `.../features/Accounting/accountingApi.js` (RTK Query endpoints: `getReceipts`, `getReceipt`, `createReceipt`, `updateReceipt`, `deleteReceipt`, `generateReceiptPDF`, `uploadReceiptAttachment`, `listReceiptAttachments`, `listReceiptHistory`)

## 1) DB & ความสัมพันธ์

* สร้างตาราง `receipts` ฟิลด์หลัก:
  `id (uuid)`, `type enum('receipt','tax_invoice','full_tax_invoice')`,
  `number`, `tax_invoice_number`, `company_id`, `customer_snapshot(json)`,
  `invoice_id`, `subtotal`, `vat_amount`, `total_amount`, `paid_amount`,
  `payment_method`, `issued_at (datetime)`, `status enum('draft','issued','void')`
* FK: `invoice_id -> invoices.id`, `company_id -> companies.id`
* Index: `(company_id, issued_at)`, `(invoice_id)`, `(number unique per company/year)`

## 2) API Contract (REST)

* `GET   /api/receipts?search=&status=&companyId=&page=1&pageSize=20`
* `GET   /api/receipts/{id}` (รวม company, invoice summary, items, attachments, history)
* `POST  /api/receipts`  body: `{type, invoice_id, issued_at, payment_method, paid_amount, company_id}`

  * เซิร์ฟเวอร์ทำ: ดึง `invoices + invoice_items` → คำนวณยอด → snapshot customer → รันเลขจาก `document_sequences` → บันทึก `document_history`
* `PUT   /api/receipts/{id}` (แก้เฉพาะ field ที่อนุญาต ชนิด/เลขห้ามแก้ถ้า `issued`)
* `DELETE /api/receipts/{id}` (soft delete/void ตามนโยบาย)
* `POST  /api/receipts/{id}/pdf` → สร้าง PDF เก็บ `document_attachments`
* `GET   /api/receipts/{id}/attachments`
* `POST  /api/receipts/{id}/attachments` (multipart)
* `GET   /api/receipts/{id}/history`

## 3) Controller/Service (หลักการทำงาน)

* `store()`:

  1. ตรวจ `invoice` valid + สถานะอนุมัติ
  2. คำนวณยอดจาก `invoices` (`has_vat`, `vat_percentage`, ฯลฯ)
  3. snapshot ลูกค้า/ที่อยู่/เลขภาษีลง `customer_snapshot`
  4. รันเลขที่ `number` และถ้า `type` เป็น `tax_invoice|full_tax_invoice` ให้รัน `tax_invoice_number` ด้วย `document_sequences`
  5. บันทึก `document_history(created)`
* `generatePdf()` ใช้ `ReceiptPdfService` + blade template แชร์สไตล์กับ invoice header/footer

## 4) Frontend (MUI + RTK Query)

* `ReceiptsPage` = Toolbar ค้นหา/ตัวกรอง + `ReceiptList` (DataGrid หรือ Card list)
* `ReceiptCard` แสดง: บริษัท, เลขเอกสาร, วันที่, ยอดรวม, สถานะ + ปุ่ม **ดูรายละเอียด / PDF / แนบไฟล์**
* `ReceiptDetailDialog`:

  * Tabs: **Summary** (หัวเอกสาร+ลูกค้า), **Items** (จาก `invoice_items`), **Totals**, **Payments**, **Attachments**, **History**
  * ปุ่ม: `พิมพ์ PDF`, `อัปโหลดไฟล์แนบ`, `Void` (ตาม Policy)
* `ReceiptCreateDialog`:

  * เลือก `invoice` → แสดง preview ยอด/รายการ → เลือก `type`, `issued_at`, `payment_method` → **Create**
* โทนสี/ฟอนต์: ใช้ tokens ของ TNP (เช่น `#900F0F`) + Sarabun

## 5) Validation & Policy

* อนุญาตออกใบเสร็จได้เฉพาะ `invoice.status in ['approved','partial_paid','paid']`
* ป้องกันเลขซ้ำในบริษัท/ปี/เดือน
* แก้ไข/void ได้ตามสิทธิ์ (role-based)

## 6) Acceptance Criteria (ย่อ)

* สร้างใบเสร็จจาก invoice ได้จริง เลขรันถูกต้อง
* รายการในใบเสร็จตรงกับ `invoice_items`
* PDF สร้าง/แนบไฟล์ได้ และรายการ/ยอดถูก
* History/Attachments แสดงใน Dialog
* ค้นหา/กรอง/แบ่งหน้าได้ลื่น

## 7) Commit Guide (ตัวอย่าง)

* `feat(receipts): scaffold model/controller/service + CRUD API`
* `feat(receipts): numbering via document_sequences + customer snapshot`
* `feat(receipts): PDF generation + attachments`
* `feat(receipts): UI list/detail/create dialogs with RTK Query`
* `chore(receipts): add policies, validations, tests`

