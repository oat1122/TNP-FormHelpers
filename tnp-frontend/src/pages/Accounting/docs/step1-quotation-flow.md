# Step 1: ใบเสนอราคา (Quotation Flow)

## 🎯 วัตถุประสงค์
สร้าง Quotation Flow ที่มี 3 ขั้นตอน: Sales สร้างและแก้ไข → Account ตรวจสอบและอนุมัติ → Sales ส่งให้ลูกค้าและอัปโหลดหลักฐาน

## 🔄 Flow การทำงาน
```
Draft → Pending Review → Approved → Sent → Completed
  ↑         ↑              ↑         ↑        ↑
Sales    Account       Account   Sales   Sales
```

## 🎨 UI Design

### ขั้นตอน 1.1: Sales สร้างใบเสนอราคา
```
Create Quotation Form:
┌─────────────────────────────────────────────────────────────┐
│ สร้างใบเสนอราคาจาก PR-2025-001                              │
│                                                             │
│ ┌─ ข้อมูลจาก Pricing Request (Auto-filled) ─────────────┐  │
│ │ Pricing Request: PR-2025-001                           │  │
│ │ งาน: งานพิมพ์โบรชัวร์ A4 4 สี                          │  │
│ │ ลูกค้า: บริษัท ABC จำกัด (ID: 123)                     │  │
│ │ เลขภาษี: 0123456789012                                │  │
│ │ ที่อยู่: 123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กทม.   │  │
│ │ รหัสไปรษณีย์: 10110                                    │  │
│ │ โทร: 02-123-4567 | อีเมล: contact@abc-company.com    │  │
│ │                                                         │  │
│ │ รายละเอียดงาน:                                          │  │
│ │ • แพทเทิร์น: A4 Brochure                              │  │
│ │ • ประเภทผ้า: Premium Paper                             │  │
│ │ • สี: 4 สี                                             │  │
│ │ • ขนาด: A4                                             │  │
│ │ • จำนวน: 2 ชิ้น                                        │  │
│ │ • วันที่ต้องการ: 30 ม.ค. 2568                          │  │
│ │                                                         │  │
│ │ Notes จาก Pricing Request:                             │  │
│ │ [Sale Note] ลูกค้าต้องการคุณภาพพิเศษ                   │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ การคำนวณราคา (Sales กรอก) ───────────────────────────┐  │
│ │ รายการ: โบรชัวร์ A4 4 สี                              │  │
│ │ จำนวน: [2] ชิ้น × ราคา [25,000.00] บาท = ฿50,000.00   │  │
│ │                                                         │  │
│ │ ยอดก่อนภาษี: ฿50,000.00                               │  │
│ │ VAT 7%: ฿3,500.00                                      │  │
│ │ ยอดรวม: ฿53,500.00                                     │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ เงื่อนไขการชำระ (Sales เลือก) ─────────────────────────┐  │
│ │ การชำระเงิน:                                            │  │
│ │ ○ เงินสด  ● เครดิต 30 วัน  ○ เครดิต 60 วัน            │  │
│ │                                                         │  │
│ │ เงินมัดจำ:                                              │  │
│ │ ○ ไม่มี  ● 50%  ○ 100%  ○ กำหนดเอง [    ]%            │  │
│ │                                                         │  │
│ │ จำนวนมัดจำ: ฿26,750.00                                 │  │
│ │ ยอดคงเหลือ: ฿26,750.00                                 │  │
│ │                                                         │  │
│ │ วันครบกำหนด: [📅 28 ม.ค. 2568] (30 วันจากวันนี้)       │  │
│ │ หมายเหตุ: [ราคานี้รวมค่าจัดส่งและติดตั้งแล้ว...]        │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ [ยกเลิก] [บันทึกร่าง] [ส่งตรวจสอบ]                         │
└─────────────────────────────────────────────────────────────┘
```

### ขั้นตอน 1.2: Account ตรวจสอบและอนุมัติ
```
Approval Interface:
┌─────────────────────────────────────────────────────────────┐
│ ตรวจสอบใบเสนอราคา QT202501-0045                             │
│                                                             │
│ ┌─ ข้อมูลเอกสาร ─────────────────────────────────────────┐  │
│ │ สร้างโดย: คุณสมชาย (ฝ่ายขาย)                            │  │
│ │ วันที่สร้าง: 15 ม.ค. 2568 10:30                        │  │
│ │ ลูกค้า: บริษัท ABC จำกัด                               │  │
│ │ ยอดรวม: ฿53,500.00                                     │  │
│ │ เงื่อนไข: เครดิต 30 วัน, มัดจำ 50%                     │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ การตรวจสอบ ───────────────────────────────────────────┐  │
│ │ ✅ ข้อมูลลูกค้าถูกต้อง                                  │  │
│ │ ✅ ราคาสินค้าตรงตาม Pricing                            │  │
│ │ ✅ การคำนวณ VAT ถูกต้อง                                │  │
│ │ ⚠️ ควรปรับเงื่อนไขเครดิตเป็น 45 วัน                   │  │
│ │                                                         │  │
│ │ หมายเหตุการตรวจสอบ:                                    │  │
│ │ [ข้อมูลถูกต้องครบถ้วน แนะนำให้อนุมัติ]                  │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ [❌ ปฏิเสธ] [✏️ ส่งกลับแก้ไข] [📝 แก้ไขและอนุมัติ] [✅ อนุมัติ] │
└─────────────────────────────────────────────────────────────┘
```

### ขั้นตอน 1.3: Sales ส่งเอกสารให้ลูกค้า
```
Send Document Interface:
┌─────────────────────────────────────────────────────────────┐
│ ส่งใบเสนอราคา QT202501-0045 (อนุมัติแล้ว)                   │
│                                                             │
│ ┌─ การส่งเอกสาร ─────────────────────────────────────────┐  │
│ │ 📄 ไฟล์ PDF: [quotation-QT202501-0045.pdf]             │  │
│ │ [📥 ดาวน์โหลด PDF] [🖨️ พิมพ์]                           │  │
│ │                                                         │  │
│ │ 📧 ส่งอีเมล:                                            │  │
│ │ ถึง: [contact@abc-company.com]                          │  │
│ │ หัวข้อ: [ใบเสนอราคา QT202501-0045 จาก TNP Group]       │  │
│ │ ข้อความ: [เรียน คุณลูกค้า ได้แนบใบเสนอราคา...]          │  │
│ │ [📧 ส่งอีเมลทันที]                                      │  │
│ │                                                         │  │
│ │ 📎 หลักฐานการส่ง:                                       │  │
│ │ [📁 อัปโหลดรูปภาพ/ไฟล์หลักฐาน]                          │  │
│ │ • รูปหน้าจอการส่งอีเมล                                  │  │
│ │ • รูปใบเซ็นรับ (ถ้าส่งด้วยตัว)                          │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ [📋 บันทึกการส่ง] [✅ ลูกค้าตอบรับแล้ว]                     │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Implementation

### Status Flow
```javascript
const QUOTATION_STATUSES = {
  DRAFT: 'draft',                    // ร่าง (Sales สร้าง)
  PENDING_REVIEW: 'pending_review',  // รอตรวจสอบ (ส่งให้ Account)
  APPROVED: 'approved',              // อนุมัติแล้ว (Account อนุมัติ)
  REJECTED: 'rejected',              // ปฏิเสธ (Account ปฏิเสธ)
  SENT: 'sent',                      // ส่งลูกค้าแล้ว (Sales ส่ง)
  COMPLETED: 'completed'             // สำเร็จ (ลูกค้าตอบรับ)
};
```

### Role-Based Actions
```javascript
const getAvailableActions = (status, userRole) => {
  const actions = {
    [QUOTATION_STATUSES.DRAFT]: {
      sales: ['edit', 'delete', 'submit_for_review'],
      account: ['edit', 'delete', 'approve', 'reject']
    },
    [QUOTATION_STATUSES.PENDING_REVIEW]: {
      sales: ['view'],
      account: ['approve', 'reject', 'send_back_for_edit']
    },
    [QUOTATION_STATUSES.APPROVED]: {
      sales: ['download_pdf', 'send_email', 'upload_evidence', 'mark_completed'],
      account: ['view', 'revoke_approval', 'create_invoice']
    },
    [QUOTATION_STATUSES.SENT]: {
      sales: ['mark_completed'],
      account: ['view', 'create_invoice']
    },
    [QUOTATION_STATUSES.COMPLETED]: {
      sales: ['view'],
      account: ['view', 'create_invoice']
    }
  };
  return actions[status]?.[userRole] || [];
};
```

## 📋 Required APIs

### POST /api/quotations (with Auto-fill support)
**Request:**
```json
{
  "pricing_request_id": 1001,
  "work_name": "งานพิมพ์โบรชัวร์ A4 4 สี",
  "pattern": "A4 Brochure",
  "fabric_type": "Premium Paper",
  "color": "4 สี",
  "sizes": "A4",
  "quantity": 2,
  "due_date": "2025-01-30",
  "customer_id": 123,
  "customer_company": "บริษัท ABC จำกัด",
  "customer_tax_id": "0123456789012",
  "customer_address": "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ",
  "customer_zip_code": "10110",
  "customer_tel_1": "02-123-4567",
  "customer_email": "contact@abc-company.com",
  "items": [
    {
      "description": "โบรชัวร์ A4 4 สี",
      "quantity": 2,
      "unit_price": 25000.00,
      "total": 50000.00
    }
  ],
  "subtotal": 50000.00,
  "vat_rate": 7,
  "vat_amount": 3500.00,
  "total_amount": 53500.00,
  "payment_terms": "credit_30_days",
  "deposit_percentage": 50,
  "deposit_amount": 26750.00,
  "remaining_amount": 26750.00,
  "notes": "[Sale Note] ลูกค้าต้องการคุณภาพพิเศษ\nราคานี้รวมค่าจัดส่งและติดตั้งแล้ว"
}
```

### PUT /api/quotations/:id
### POST /api/quotations/:id/submit
### POST /api/quotations/:id/approve
### POST /api/quotations/:id/reject
### GET /api/quotations/:id/pdf
### POST /api/quotations/:id/send-email

## 🔐 Permissions
- **Sales**: สร้าง แก้ไข ส่งตรวจสอบ ส่งลูกค้า (เฉพาะที่ตัวเองสร้าง)
- **Account**: ตรวจสอบ อนุมัติ ปฏิเสธ แก้ไขได้ทุกอัน

## ✅ Acceptance Criteria
1. Sales สร้างใบเสนอราคาจาก Pricing Request ได้ด้วย Auto-fill
2. Auto-fill ข้อมูลลูกค้าและรายละเอียดงานตาม technical-implementation.md
3. แก้ไขเงื่อนไขการชำระและเงินมัดจำได้
4. ส่งตรวจสอบให้ Account ได้
5. Account ตรวจสอบและอนุมัติ/ปฏิเสธได้
6. Sales ส่งให้ลูกค้าและอัปโหลดหลักฐานได้
7. ระบบคำนวณ VAT อัตโนมัติ
8. สร้าง PDF และส่งอีเมลได้
9. รองรับการนำ Notes จาก Pricing Request มาแสดง

## 🚀 AI Command
```bash
สร้าง Quotation Flow ที่มี 3 ขั้นตอน:
1. Sales สร้างและแก้ไขด้วย Auto-fill จาก Pricing Request
2. Account ตรวจสอบและอนุมัติ  
3. Sales ส่งให้ลูกค้าและอัปโหลดหลักฐาน
โดยใช้ข้อมูลตาม technical-implementation.md
```
