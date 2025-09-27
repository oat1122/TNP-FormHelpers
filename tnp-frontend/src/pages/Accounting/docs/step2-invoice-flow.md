# Step 2: ใบแจ้งหนี้ (Invoice Flow)

## 🎯 วัตถุประสงค์

สร้าง One-Click Conversion จากใบเสนอราคาเป็นใบแจ้งหนี้
พร้อมระบบเลือกประเภทการเรียกเก็บ (เต็มจำนวน/ส่วนที่เหลือ/บางส่วน)
และระบบติดตามการชำระเงิน

## 🔄 Flow การทำงาน

```
Quotation (Approved) → One-Click Convert → Invoice → Payment Tracking → Receipt
```

## 🎨 UI Design

### ขั้นตอน 2.1: One-Click Conversion

```
Invoice Creation from Quotation:
┌─────────────────────────────────────────────────────────────┐
│ สร้างใบแจ้งหนี้จากใบเสนอราคา QT202501-0045                  │
│                                                             │
│ ┌─ ข้อมูลต้นฉบับ ────────────────────────────────────────┐  │
│ │ 📋 ใบเสนอราคา: QT202501-0045                          │  │
│ │ 🆔 Pricing Request: PR-2025-001                       │  │
│ │ 👤 ลูกค้า: บริษัท ABC จำกัด (ID: 123)                  │  │
│ │ 🏢 เลขภาษี: 0123456789012                             │  │
│ │ 📍 ที่อยู่: 123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กทม.│  │
│ │ ☎️ โทร: 02-123-4567                                   │  │
│ │ 💰 ยอดรวมใบเสนอราคา: ฿53,500.00                       │  │
│ │ 💵 เงินมัดจำ: ฿26,750.00 (50%)                        │  │
│ │ 💳 ยอดคงเหลือ: ฿26,750.00                             │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ ตัวเลือกการเรียกเก็บ ──────────────────────────────────┐  │
│ │ ประเภทใบแจ้งหนี้:                                       │  │
│ │ ○ เรียกเก็บเต็มจำนวน (฿53,500.00)                      │  │
│ │ ● เรียกเก็บส่วนที่เหลือ (฿26,750.00) - หลังหักมัดจำ     │  │
│ │ ○ เรียกเก็บบางส่วน [         ] บาท                     │  │
│ │                                                         │  │
│ │ เลขที่ใบแจ้งหนี้: [INV202501-0123] (auto-generate)     │  │
│ │ วันที่ออกใบ: [16 ม.ค. 2568]                            │  │
│ │ วันครบกำหนดชำระ: [15 ก.พ. 2568] (30 วันจากออกใบ)      │  │
│ │                                                         │  │
│ │ หมายเหตุ: [กรุณาชำระภายในกำหนด เพื่อหลีกเลี่ยงค่าปรับ]  │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ รายการสินค้า (คัดลอกจากใบเสนอราคา) ──────────────────┐  │
│ │ งาน: งานพิมพ์โบรชัวร์ A4 4 สี (จาก PR-2025-001)        │  │
│ │ รายละเอียด:                                             │  │
│ │ • แพทเทิร์น: A4 Brochure                              │  │
│ │ • ประเภทผ้า: Premium Paper                             │  │
│ │ • สี: 4 สี                                             │  │
│ │ • ขนาด: A4                                             │  │
│ │ • จำนวน: 2 ชิ้น × ฿25,000.00 = ฿50,000.00           │  │
│ │                                                         │  │
│ │ รวมก่อนภาษี: ฿50,000.00                                │  │
│ │ VAT 7%: ฿3,500.00                                      │  │
│ │ รวมทั้งสิ้น: ฿53,500.00                                 │  │
│ │ หักเงินมัดจำ: -฿26,750.00                              │  │
│ │ ยอดที่ต้องชำระ: ฿26,750.00                             │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ [ยกเลิก] [บันทึกร่าง] [สร้างใบแจ้งหนี้]                    │
└─────────────────────────────────────────────────────────────┘
```

### ขั้นตอน 2.2: Account ตรวจสอบและอนุมัติ

```
Invoice Approval Interface:
┌─────────────────────────────────────────────────────────────┐
│ ตรวจสอบใบแจ้งหนี้ INV202501-0123                            │
│                                                             │
│ ┌─ การตรวจสอบข้อมูล ─────────────────────────────────────┐  │
│ │ ✅ อ้างอิงใบเสนอราคาถูกต้อง (QT202501-0045)             │  │
│ │ ✅ อ้างอิง Pricing Request ถูกต้อง (PR-2025-001)        │  │
│ │ ✅ ข้อมูลลูกค้าตรงกับฐานข้อมูล                           │  │
│ │ ✅ การคำนวณยอดถูกต้อง                                   │  │
│ │ ✅ เงื่อนไขการชำระตรงตามสัญญา                           │  │
│ │                                                         │  │
│ │ การปรับแต่งเพิ่มเติม (ถ้าจำเป็น):                        │  │
│ │ Credit Term: [30 วัน ▼] (ปรับได้)                       │  │
│ │ รวมบิลกับออเดอร์อื่น: [☐ รวมกับ INV202501-0122]         │  │
│ │ ข้อมูลภาษี: [☐ แก้ไขที่อยู่ภาษี] [☐ เปลี่ยนเลขภาษี]     │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ ผลการตรวจสอบ ─────────────────────────────────────────┐  │
│ │ หมายเหตุ: [ข้อมูลครบถ้วนถูกต้อง พร้อมส่งลูกค้า]         │  │
│ │                                                         │  │
│ │ [❌ ปฏิเสธ] [✏️ ส่งกลับแก้ไข] [✅ อนุมัติและส่ง]        │  │
│ └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### ขั้นตอน 2.3: ส่งใบแจ้งหนี้และติดตามการชำระ

```
Invoice Tracking Interface:
┌─────────────────────────────────────────────────────────────┐
│ ใบแจ้งหนี้ INV202501-0123 - ติดตามการชำระ                   │
│                                                             │
│ ┌─ สถานะการชำระ ─────────────────────────────────────────┐  │
│ │ สถานะ: 🟡 รอชำระ                                       │  │
│ │ ยอดที่ต้องชำระ: ฿26,750.00                             │  │
│ │ ชำระแล้ว: ฿0.00                                        │  │
│ │ คงเหลือ: ฿26,750.00                                     │  │
│ │ วันครบกำหนด: 15 ก.พ. 2568 (เหลือ 12 วัน)               │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ การส่งและติดตาม ──────────────────────────────────────┐  │
│ │ ส่งใบแจ้งหนี้:                                          │  │
│ │ [📧 ส่งอีเมล] [📱 ส่ง SMS] [🔗 สร้างลิงก์ออนไลน์]       │  │
│ │                                                         │  │
│ │ ประวัติการติดตาม:                                        │  │
│ │ ✅ 16 ม.ค. ส่งอีเมลใบแจ้งหนี้                          │  │
│ │ ✅ 20 ม.ค. โทรติดตาม - ลูกค้ารับทราบ                   │  │
│ │ ⏰ 25 ม.ค. ส่งการแจ้งเตือนอัตโนมัติ                     │  │
│ │                                                         │  │
│ │ [📞 บันทึกการติดตาม] [⚠️ ส่งการแจ้งเตือน]                │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ บันทึกการชำระ ────────────────────────────────────────┐  │
│ │ เมื่อลูกค้าชำระเงิน:                                    │  │
│ │ [💰 บันทึกการชำระ] [🧾 สร้างใบเสร็จอัตโนมัติ]          │  │
│ └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Implementation

### Cascade Auto-fill Implementation

```javascript
// Auto-fill Invoice จาก Quotation ตาม technical-implementation.md
const createInvoiceFromQuotation = async (
  quotationId,
  invoiceType = "remaining"
) => {
  const quotationData = await quotationApi.getDetail(quotationId);

  // Cascade Auto-fill ตาม AutofillWorkflow
  const invoiceData = {
    // ข้อมูลอ้างอิง
    quotation_id: quotationData.id,
    pricing_request_id: quotationData.pricing_request_id,

    // Auto-fill ข้อมูลลูกค้าจาก CustomerAutofillDTO
    customer_id: quotationData.customer_id,
    customer_company: quotationData.customer_company,
    customer_tax_id: quotationData.customer_tax_id,
    customer_address: quotationData.customer_address,
    customer_zip_code: quotationData.customer_zip_code,
    customer_tel_1: quotationData.customer_tel_1,
    customer_email: quotationData.customer_email,

    // Auto-fill รายละเอียดงาน
    work_name: quotationData.work_name,
    pattern: quotationData.pattern,
    fabric_type: quotationData.fabric_type,
    color: quotationData.color,
    sizes: quotationData.sizes,
    quantity: quotationData.quantity,
    due_date: quotationData.due_date,

    // คำนวณยอดตามประเภท Invoice
    type: invoiceType,
    subtotal: quotationData.subtotal,
    vat_rate: quotationData.vat_rate,
    vat_amount: quotationData.vat_amount,
    total_amount: calculateInvoiceAmount(quotationData, invoiceType),

    // เงื่อนไขการชำระ
    payment_terms: quotationData.payment_terms,
    due_date: calculateDueDate(quotationData.payment_terms),

    status: "draft",
  };

  return invoiceApi.create(invoiceData);
};

const calculateInvoiceAmount = (quotationData, invoiceType) => {
  switch (invoiceType) {
    case "full_amount":
      return quotationData.total_amount;
    case "remaining":
      return quotationData.total_amount - quotationData.deposit_amount;
    case "deposit":
      return quotationData.deposit_amount;
    default:
      return quotationData.total_amount;
  }
};
```

### Payment Status Flow

```javascript
const PAYMENT_STATUSES = {
  PENDING: "pending", // รอชำระ
  PARTIAL_PAID: "partial_paid", // จ่ายบางส่วน
  FULLY_PAID: "fully_paid", // จ่ายครบแล้ว
  OVERDUE: "overdue", // เกินกำหนด
  CANCELLED: "cancelled", // ยกเลิก
};

// Status Colors
const STATUS_COLORS = {
  fully_paid: "🟢", // จ่ายแล้ว
  pending: "🟡", // รอชำระ
  overdue: "🔴", // เกินกำหนด
  partial_paid: "🔵", // จ่ายบางส่วน
  cancelled: "⚫", // ยกเลิก
};
```

### One-Click Conversion Function

```javascript
const convertQuotationToInvoice = async (quotationId, options) => {
  const quotation = await quotationApi.getById(quotationId);

  // คำนวณยอดตามประเภท
  let invoiceAmount = 0;
  switch (options.type) {
    case INVOICE_TYPES.FULL_AMOUNT:
      invoiceAmount = quotation.total_amount;
      break;
    case INVOICE_TYPES.REMAINING:
      invoiceAmount = quotation.total_amount - quotation.deposit_amount;
      break;
    case INVOICE_TYPES.PARTIAL:
      invoiceAmount = options.custom_amount;
      break;
  }

  const invoiceData = {
    quotation_id: quotationId,
    customer_id: quotation.customer_id,
    number: generateInvoiceNumber(),
    items: quotation.items,
    subtotal: calculateSubtotal(invoiceAmount),
    tax_amount: calculateTax(invoiceAmount),
    total_amount: invoiceAmount,
    due_date: calculateDueDate(options.payment_terms),
    status: "draft",
    created_by: getCurrentUser().id,
  };

  return invoiceApi.create(invoiceData);
};
```

## 📋 Required APIs

### POST /api/quotations/:id/convert-to-invoice

### POST /api/invoices/:id/record-payment

### GET /api/invoices/:id/payment-history

### POST /api/invoices/:id/send-reminder

### PUT /api/invoices/:id/status

## 🔐 Permissions

- **Sales**: ดูข้อมูลได้ แต่ไม่สามารถแก้ไขได้
- **Account**: สร้าง แก้ไข อนุมัติ บันทึกการชำระ

## ✅ Acceptance Criteria

1. แปลงใบเสนอราคาเป็นใบแจ้งหนี้ได้คลิกเดียว
2. เลือกประเภทการเรียกเก็บได้ (เต็มจำนวน/คงเหลือ/บางส่วน)
3. Account ตรวจสอบและอนุมัติได้
4. ส่งใบแจ้งหนี้ทางอีเมลได้
5. ติดตามสถานะการชำระได้
6. บันทึกการชำระเงินได้
7. ส่งการแจ้งเตือนอัตโนมัติเมื่อเกินกำหนด

## 🚀 AI Command

```bash
สร้าง One-Click Conversion จากใบเสนอราคาเป็นใบแจ้งหนี้
พร้อมระบบเลือกประเภทการเรียกเก็บ (เต็มจำนวน/ส่วนที่เหลือ/บางส่วน)
และระบบติดตามการชำระเงิน
```
