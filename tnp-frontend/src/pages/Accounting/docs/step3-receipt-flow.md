# Step 3: ใบเสร็จ/ใบกำกับภาษี (Receipt/Tax Invoice Flow)

## 🎯 วัตถุประสงค์

สร้างระบบบันทึกการชำระเงินและออกใบเสร็จ/ใบกำกับภาษีอัตโนมัติ พร้อมการคำนวณ VAT
และ running number ตามมาตรฐาน

## 🔄 Flow การทำงาน

```
Invoice (Payment) → Record Payment → Auto Generate Receipt/Tax Invoice → Account Approve
```

## 🎨 UI Design

### ขั้นตอน 3.1: บันทึกการชำระเงิน

```
Payment Recording Interface:
┌─────────────────────────────────────────────────────────────┐
│ บันทึกการชำระเงิน - INV202501-0123                          │
│                                                             │
│ ┌─ ข้อมูลใบแจ้งหนี้ ──────────────────────────────────────┐  │
│ │ 💰 ใบแจ้งหนี้: INV202501-0123                          │  │
│ │ � อ้างอิงใบเสนอราคา: QT202501-0045                    │  │
│ │ 🆔 อ้างอิง Pricing Request: PR-2025-001               │  │
│ │ �👤 ลูกค้า: บริษัท ABC จำกัด (ID: 123)                  │  │
│ │ 🏢 เลขภาษี: 0123456789012                             │  │
│ │ 💵 ยอดรวม: ฿26,750.00                                 │  │
│ │ 💳 ชำระแล้ว: ฿0.00                                    │  │
│ │ 🔥 คงเหลือ: ฿26,750.00                                │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ รายละเอียดการชำระ ─────────────────────────────────────┐  │
│ │ 📅 วันที่ชำระ: [20 ม.ค. 2568]                          │  │
│ │ 💰 จำนวนเงิน: [26,750.00] บาท                         │  │
│ │                                                         │  │
│ │ 💳 วิธีการชำระ:                                        │  │
│ │ ○ เงินสด                                               │  │
│ │ ● โอนเงิน                                              │  │
│ │ ○ เช็ค                                                 │  │
│ │ ○ บัตรเครดิต                                           │  │
│ │                                                         │  │
│ │ 🏦 ธนาคาร: [กสิกรไทย ▼]                               │  │
│ │ 🔢 เลขที่อ้างอิง: [TXN-20250120-001]                  │  │
│ │ 📝 หมายเหตุ: [ชำระผ่านการโอนเงิน]                     │  │
│ │                                                         │  │
│ │ 📎 หลักฐานการชำระ:                                     │  │
│ │ [📁 อัปโหลดสลิป/ใบเสร็จ] - slip_20250120.jpg         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ [ยกเลิก] [บันทึกการชำระ] [บันทึก + สร้างใบเสร็จ]           │
└─────────────────────────────────────────────────────────────┘
```

### ขั้นตอน 3.2: สร้างใบเสร็จ/ใบกำกับภาษีอัตโนมัติ

```
Auto Receipt Generation:
┌─────────────────────────────────────────────────────────────┐
│ สร้างใบเสร็จ/ใบกำกับภาษีอัตโนมัติ                           │
│                                                             │
│ ┌─ ข้อมูลการชำระ ─────────────────────────────────────────┐  │
│ │ การชำระ: ฿26,750.00 (ชำระครบแล้ว)                      │  │
│ │ วันที่ชำระ: 20 ม.ค. 2568                               │  │
│ │ วิธีการ: โอนเงิน (TXN-20250120-001)                    │  │
│ │ อ้างอิงใบแจ้งหนี้: INV202501-0123                       │  │
│ │ อ้างอิงใบเสนอราคา: QT202501-0045                       │  │
│ │ อ้างอิง Pricing Request: PR-2025-001                  │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ ประเภทเอกสารที่จะออก ─────────────────────────────────┐  │
│ │ เลือกประเภท:                                           │  │
│ │ ○ ใบเสร็จธรรมดา (ไม่มี VAT)                            │  │
│ │ ● ใบกำกับภาษี (มี VAT 7%)                              │  │
│ │ ○ ใบกำกับภาษี/ใบเสร็จ (เต็มรูปแบบ)                     │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ การคำนวณอัตโนมัติ ────────────────────────────────────┐  │
│ │ ยอดชำระ: ฿26,750.00                                   │  │
│ │                                                         │  │
│ │ การแยก VAT (ราคารวม VAT แล้ว):                          │  │
│ │ ยอดก่อนภาษี: ฿25,000.00                               │  │
│ │ VAT 7%: ฿1,750.00                                      │  │
│ │ ยอดรวม: ฿26,750.00                                     │  │
│ │                                                         │  │
│ │ เลขที่เอกสาร: [RCPT202501-0089] (Auto-generate)       │  │
│ │ เลขที่กำกับภาษี: [AA12345678901-002568-001]            │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ [สร้างใบเสร็จ/ใบกำกับภาษี]                                │
└─────────────────────────────────────────────────────────────┘
```

### ขั้นตอน 3.3: Account ตรวจสอบและอนุมัติ

```
Final Receipt Approval:
┌─────────────────────────────────────────────────────────────┐
│ ตรวจสอบใบเสร็จ/ใบกำกับภาษี RCPT202501-0089                 │
│                                                             │
│ ┌─ รายละเอียดเอกสาร ─────────────────────────────────────┐  │
│ │ ประเภท: ใบกำกับภาษี (VAT Invoice)                       │  │
│ │ อ้างอิง: INV202501-0123 (ใบแจ้งหนี้)                    │  │
│ │ การชำระ: โอนเงิน ฿26,750.00                            │  │
│ │ VAT: ฿1,750.00 (7% ของ ฿25,000.00)                     │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ การตรวจสอบสุดท้าย ────────────────────────────────────┐  │
│ │ ✅ การคำนวณ VAT ถูกต้อง                                │  │
│ │ ✅ เลขที่เอกสารตรงตาม Format                           │  │
│ │ ✅ ข้อมูลลูกค้าครบถ้วน                                 │  │
│ │                                                         │  │
│ │ การปรับแต่งล่าสุด (ถ้าจำเป็น):                          │  │
│ │ ที่อยู่จัดส่ง: [☐ ใช้ที่อยู่ลูกค้า] [☐ ที่อยู่อื่น]     │  │
│ │ หมายเหตุพิเศษ: [ขอบคุณที่ใช้บริการ]                    │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ ผลกระทบเมื่ออนุมัติ ──────────────────────────────────┐  │
│ │ เมื่ออนุมัติแล้ว:                                       │  │
│ │ • ระบบจะรันเลขใบกำกับภาษีอัตโนมัติ                     │  │
│ │ • อัปเดตสต็อกสินค้า (ถ้ามี)                            │  │
│ │ • เปลี่ยนสถานะใบแจ้งหนี้เป็น "ชำระแล้ว"                │  │
│ │ • สามารถสร้างใบส่งของได้                               │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ [❌ ปฏิเสธ] [✏️ แก้ไข] [✅ อนุมัติและออกเอกสาร]            │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Implementation

### Cascade Auto-fill สำหรับ Receipt

```javascript
// Auto-fill Receipt จาก Invoice ตาม technical-implementation.md
const createReceiptFromInvoice = async (invoiceId, paymentData) => {
  const invoiceData = await invoiceApi.getDetail(invoiceId);

  // Cascade Auto-fill ตาม AutofillWorkflow
  const receiptData = {
    // ข้อมูลอ้างอิง
    invoice_id: invoiceData.id,
    quotation_id: invoiceData.quotation_id,
    pricing_request_id: invoiceData.pricing_request_id,

    // Auto-fill ข้อมูลลูกค้าจาก CustomerAutofillDTO
    customer_id: invoiceData.customer_id,
    customer_company: invoiceData.customer_company,
    customer_tax_id: invoiceData.customer_tax_id,
    customer_address: invoiceData.customer_address,
    customer_zip_code: invoiceData.customer_zip_code,
    customer_tel_1: invoiceData.customer_tel_1,
    customer_email: invoiceData.customer_email,

    // Auto-fill รายละเอียดงาน
    work_name: invoiceData.work_name,
    pattern: invoiceData.pattern,
    fabric_type: invoiceData.fabric_type,
    color: invoiceData.color,

    // ข้อมูลการชำระ
    payment_date: paymentData.payment_date,
    payment_method: paymentData.payment_method,
    payment_amount: paymentData.amount,
    payment_reference: paymentData.reference,
    bank_name: paymentData.bank_name,

    // การคำนวณ VAT
    receipt_type: determineReceiptType(invoiceData),
    subtotal: invoiceData.subtotal,
    vat_rate: invoiceData.vat_rate,
    vat_amount: invoiceData.vat_amount,
    total_amount: paymentData.amount,

    status: "draft",
  };

  return receiptApi.create(receiptData);
};

const determineReceiptType = (invoiceData) => {
  // ตรวจสอบว่าลูกค้ามีเลขภาษีหรือไม่
  if (
    invoiceData.customer_tax_id &&
    invoiceData.customer_tax_id.length === 13
  ) {
    return "tax_invoice"; // ใบกำกับภาษี
  }
  return "receipt"; // ใบเสร็จธรรมดา
};
```

### Auto Generate Document Number

```javascript
const generateDocumentNumber = (type, date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const sequence = getNextSequenceNumber(type, year, month);

  const formats = {
    receipt: `RCPT${year}${month}-${sequence.toString().padStart(4, "0")}`,
    tax_invoice: `TAX${year}${month}-${sequence.toString().padStart(4, "0")}`,
    delivery_note: `DN${year}${month}-${sequence.toString().padStart(4, "0")}`,
  };

  return formats[type];
};
```

### Receipt Types

```javascript
const RECEIPT_TYPES = {
  SIMPLE: "receipt", // ใบเสร็จธรรมดา
  TAX_INVOICE: "tax_invoice", // ใบกำกับภาษี
  FULL_TAX_INVOICE: "full_tax_invoice", // ใบกำกับภาษี/ใบเสร็จ
};
```

### Payment Methods

```javascript
const PAYMENT_METHODS = {
  CASH: "cash", // เงินสด
  TRANSFER: "transfer", // โอนเงิน
  CHECK: "check", // เช็ค
  CREDIT_CARD: "credit_card", // บัตรเครดิต
};
```

## 📋 Required APIs

### POST /api/invoices/:id/record-payment

**Request:**

```json
{
  "amount": 26750.0,
  "payment_date": "2025-01-20",
  "payment_method": "transfer",
  "bank": "กสิกรไทย",
  "reference_number": "TXN-20250120-001",
  "notes": "ชำระผ่านการโอนเงิน",
  "evidence_file": "slip_20250120.jpg"
}
```

### POST /api/invoices/:id/convert-to-receipt

### POST /api/receipts/:id/generate-tax-number

### GET /api/receipts/:id/pdf

## 🔐 Permissions

- **Sales**: ดูข้อมูลได้เท่านั้น
- **Account**: บันทึกการชำระ สร้างใบเสร็จ อนุมัติ

## ✅ Acceptance Criteria

1. บันทึกการชำระเงินด้วยวิธีต่างๆ ได้
2. อัปโหลดหลักฐานการชำระได้
3. สร้างใบเสร็จ/ใบกำกับภาษีอัตโนมัติ
4. คำนวณ VAT ถูกต้องตามมาตรฐาน
5. Generate เลขที่เอกสารอัตโนมัติ
6. Account ตรวจสอบและอนุมัติได้
7. อัปเดตสถานะใบแจ้งหนี้เป็น "ชำระแล้ว"

## 🚀 AI Command

```bash
สร้างระบบบันทึกการชำระเงินและออกใบเสร็จ/ใบกำกับภาษีอัตโนมัติ
พร้อมการคำนวณ VAT และ running number ตามมาตรฐาน
```
