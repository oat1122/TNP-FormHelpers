# Step 4: ใบส่งของ (Delivery Note Flow)

## 🎯 วัตถุประสงค์
สร้างระบบใบส่งของพร้อมติดตามสถานะการจัดส่ง รองรับการส่งด้วยตัวเอง บริษัทขนส่ง และลูกค้ามารับเอง พร้อม timeline tracking และ integration กับระบบขนส่ง

## 🔄 Flow การทำงาน
```
Receipt (Approved) → Create Delivery Note → Ship → Track → Delivered → Completed
```

## 🎨 UI Design

### ขั้นตอน 4.1: สร้างใบส่งของ
```
Create Delivery Note:
┌─────────────────────────────────────────────────────────────┐
│ สร้างใบส่งของจากใบเสร็จ RCPT202501-0089                     │
│                                                             │
│ ┌─ ข้อมูลต้นฉบับ ────────────────────────────────────────┐  │
│ │ อ้างอิง: RCPT202501-0089 (ใบเสร็จ/ใบกำกับภาษี)         │  │
│ │ ใบแจ้งหนี้: INV202501-0123                             │  │
│ │ ใบเสนอราคา: QT202501-0045                             │  │
│ │ Pricing Request: PR-2025-001                          │  │
│ │ ลูกค้า: บริษัท ABC จำกัด (ID: 123)                     │  │
│ │ ยอดเงิน: ฿26,750.00 (ชำระแล้ว)                       │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ รายการส่ง ────────────────────────────────────────────┐  │
│ │ รายการสินค้า/บริการ:                                    │  │
│ │ ✅ งานพิมพ์โบรชัวร์ A4 4 สี (จาก PR-2025-001)          │  │
│ │    รายละเอียด:                                          │  │
│ │    • แพทเทิร์น: A4 Brochure                           │  │
│ │    • ประเภทผ้า: Premium Paper                          │  │
│ │    • สี: 4 สี                                          │  │
│ │    • ขนาด: A4                                          │  │
│ │    • จำนวน: 2 ชิ้น                                     │  │
│ │    • น้ำหนัก: 5 กก.                                     │  │
│ │    • ขนาดพัสดุ: 50×35×10 ซม.                            │  │
│ │                                                         │  │
│ │ หมายเหตุสินค้า: [ห่อด้วยพลาสติกกันน้ำ]                 │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ ข้อมูลการจัดส่ง ──────────────────────────────────────┐  │
│ │ วันที่ส่ง: [22 ม.ค. 2568]                              │  │
│ │ เวลาส่ง: [09:00] น.                                   │  │
│ │                                                         │  │
│ │ ที่อยู่ส่ง: (Auto-fill จาก Customer DTO)                │  │
│ │ [📍 ใช้ที่อยู่ลูกค้า] [📝 ที่อยู่อื่น]                  │  │
│ │ 123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110  │  │
│ │                                                         │  │
│ │ ผู้รับ: [คุณสมชาย สมิท] (จาก customer_firstname)       │  │
│ │ เบอร์ติดต่อ: [02-123-4567] (จาก customer_tel_1)       │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ วิธีการส่ง ───────────────────────────────────────────┐  │
│ │ เลือกวิธีการส่ง:                                       │  │
│ │ ○ ส่งเอง (พนักงานบริษัท)                               │  │
│ │ ● บริษัทขนส่ง                                          │  │
│ │ ○ ลูกค้ามารับเอง                                       │  │
│ │                                                         │  │
│ │ บริษัทขนส่ง: [Kerry Express ▼]                         │  │
│ │ ประเภทบริการ: [Express ▼]                              │  │
│ │ ค่าส่ง: [฿150.00] (ลูกค้าจ่าย/บริษัทจ่าย)               │  │
│ │ Tracking Number: [จะได้รับหลังส่ง]                     │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ [ยกเลิก] [บันทึกร่าง] [สร้างใบส่งของ]                      │
└─────────────────────────────────────────────────────────────┘
```

### ขั้นตอน 4.2: ติดตามสถานะการส่ง
```
Delivery Tracking Interface:
┌─────────────────────────────────────────────────────────────┐
│ ใบส่งของ DN202501-0056 - ติดตามสถานะ                        │
│                                                             │
│ ┌─ สถานะปัจจุบัน ────────────────────────────────────────┐  │
│ │ สถานะ: 🟡 กำลังส่ง                                     │  │
│ │ ผู้ส่ง: Kerry Express                                  │  │
│ │ Tracking: ABC123456789                                  │  │
│ │ คาดว่าจะถึง: 23 ม.ค. 2568 ก่อน 18:00                   │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ Timeline การส่ง ──────────────────────────────────────┐  │
│ │ ✅ 22 ม.ค. 09:00 - สร้างใบส่งของ                      │  │
│ │ ✅ 22 ม.ค. 10:30 - มอบให้ Kerry Express               │  │
│ │ ✅ 22 ม.ค. 12:00 - รับที่ศูนย์กระจายสินค้า             │  │
│ │ ✅ 22 ม.ค. 14:00 - ออกจากศูนย์กระจาย กทม.              │  │
│ │ 🟡 22 ม.ค. 18:00 - อยู่ระหว่างขนส่ง                   │  │
│ │ ⏳ 23 ม.ค. 16:00 - คาดว่าจะส่งถึงลูกค้า                │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ การติดตามและอัปเดต ───────────────────────────────────┐  │
│ │ [🚚 ติดตามพัสดุ] [📞 ติดต่อขนส่ง] [📱 แจ้งลูกค้า]        │  │
│ │                                                         │  │
│ │ บันทึกการติดตาม:                                        │  │
│ │ 22 ม.ค. 15:00 - โทรแจ้งลูกค้าว่าสินค้าออกแล้ว          │  │
│ │ [📝 เพิ่มบันทึกใหม่]                                    │  │
│ │                                                         │  │
│ │ เมื่อส่งสำเร็จ:                                          │  │
│ │ [✅ ยืนยันการส่งสำเร็จ] [📋 อัปโหลดใบรับสินค้า]          │  │
│ └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### ขั้นตอน 4.3: ปิดงานและสรุป
```
Job Completion Summary:
┌─────────────────────────────────────────────────────────────┐
│ สรุปงาน - บริษัท ABC จำกัด (งาน PRC-2025-001)               │
│                                                             │
│ ┌─ สถานะสุดท้าย ─────────────────────────────────────────┐  │
│ │ สถานะงาน: ✅ ส่งสำเร็จแล้ว                              │  │
│ │ วันที่ส่งสำเร็จ: 23 ม.ค. 2568 15:30                     │  │
│ │ ผู้รับ: คุณสมชาย สมิท (เซ็นรับแล้ว)                     │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ สรุปเอกสารทั้งหมด ────────────────────────────────────┐  │
│ │ 📋 Pricing Request: PR-2025-001 ✅ (10 ม.ค. 2568)     │  │
│ │ 📋 ใบเสนอราคา: QT202501-0045 ✅ (15 ม.ค. 2568)        │  │
│ │ 💰 ใบแจ้งหนี้: INV202501-0123 ✅ (16 ม.ค. 2568)        │  │
│ │ 🧾 ใบเสร็จ/ใบกำกับ: RCPT202501-0089 ✅ (20 ม.ค. 2568) │  │
│ │ 📦 ใบส่งของ: DN202501-0056 ✅ (23 ม.ค. 2568)           │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ สรุปการเงิน ──────────────────────────────────────────┐  │
│ │ ยอดรวมทั้งหมด: ฿53,500.00                              │  │
│ │ เงินมัดจำ: ฿26,750.00 (รับแล้ว)                        │  │
│ │ ยอดคงเหลือ: ฿26,750.00 (รับแล้ว)                       │  │
│ │ สถานะการชำระ: ✅ ชำระครบแล้ว                            │  │
│ │                                                         │  │
│ │ กำไรขาดทุน: (ตาม Pricing Request)                       │  │
│ │ รายได้: ฿53,500.00                                      │  │
│ │ ต้นทุน: ฿35,000.00 (จาก PR-2025-001)                   │  │
│ │ กำไร: ฿18,500.00 (34.6%)                               │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ การดำเนินการต่อ ──────────────────────────────────────┐  │
│ │ [📊 ดูรายงานสรุปงาน] [📧 ส่งรายงานให้ผู้จัดการ]          │  │
│ │ [🔄 สร้างงานติดตามหลังการขาย] [⭐ ประเมินความพึงพอใจ]    │  │
│ │ [📁 เก็บเอกสารเข้าระบบเก็บถาวร]                         │  │
│ └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Implementation

### Delivery Status Flow
```javascript
const DELIVERY_STATUSES = {
  PREPARING: 'preparing',          // เตรียมส่ง
  SHIPPING: 'shipping',            // กำลังส่ง  
  IN_TRANSIT: 'in_transit',        // อยู่ระหว่างขนส่ง
  DELIVERED: 'delivered',          // ส่งถึงแล้ว
  COMPLETED: 'completed',          // เสร็จสิ้น
  FAILED: 'failed',                // ส่งไม่สำเร็จ
  RETURNED: 'returned',            // ส่งคืน
  CANCELLED: 'cancelled'           // ยกเลิก
};

// Status Colors
const DELIVERY_STATUS_COLORS = {
  completed: '🟢',     // ส่งสำเร็จ
  in_transit: '🟡',   // กำลังส่ง
  preparing: '🔵',    // เตรียมส่ง
  failed: '🔴',       // ส่งไม่สำเร็จ
  cancelled: '⚫',    // ยกเลิก
  returned: '🟠'      // ส่งคืน
};
```

### Delivery Methods
```javascript
const DELIVERY_METHODS = {
  SELF_DELIVERY: 'self_delivery',  // ส่งเอง
  COURIER: 'courier',              // บริษัทขนส่ง
  CUSTOMER_PICKUP: 'customer_pickup' // ลูกค้ามารับ
};

const COURIER_COMPANIES = [
  { id: 'kerry', name: 'Kerry Express', services: ['standard', 'express'] },
  { id: 'thailand_post', name: 'ไปรษณีย์ไทย', services: ['ems', 'registered'] },
  { id: 'flash', name: 'Flash Express', services: ['standard', 'same_day'] },
  { id: 'j_t', name: 'J&T Express', services: ['standard', 'express'] }
];
```

### Courier Integration API
```javascript
const courierApiIntegration = {
  // Kerry Express API
  kerry: {
    createShipment: async (shipmentData) => {
      const response = await fetch('/api/courier/kerry/create-shipment', {
        method: 'POST',
        body: JSON.stringify(shipmentData)
      });
      return response.json();
    },
    
    trackShipment: async (trackingNumber) => {
      const response = await fetch(`/api/courier/kerry/track/${trackingNumber}`);
      return response.json();
    }
  },
  
  // Generic tracking function
  trackShipment: async (courier, trackingNumber) => {
    return courierApiIntegration[courier]?.trackShipment(trackingNumber);
  }
};
```

### Timeline Tracking
```javascript
const createDeliveryTimeline = (deliveryNote) => {
  const timeline = [
    {
      status: 'preparing',
      timestamp: deliveryNote.created_at,
      description: 'สร้างใบส่งของ',
      user: deliveryNote.created_by
    }
  ];
  
  if (deliveryNote.shipping_date) {
    timeline.push({
      status: 'shipping',
      timestamp: deliveryNote.shipping_date,
      description: `มอบให้ ${deliveryNote.courier_company}`,
      trackingNumber: deliveryNote.tracking_number
    });
  }
  
  // Add courier tracking events
  if (deliveryNote.tracking_events) {
    timeline.push(...deliveryNote.tracking_events.map(event => ({
      status: 'in_transit',
      timestamp: event.timestamp,
      description: event.description,
      location: event.location
    })));
  }
  
  if (deliveryNote.delivered_at) {
    timeline.push({
      status: 'delivered',
      timestamp: deliveryNote.delivered_at,
      description: `ส่งถึงผู้รับ: ${deliveryNote.recipient_name}`,
      signature: deliveryNote.delivery_signature
    });
  }
  
  return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};
```

## 📋 Required APIs

### POST /api/receipts/:id/convert-to-delivery-note
**Request:**
```json
{
  "delivery_method": "courier",
  "courier_company": "kerry",
  "service_type": "express",
  "delivery_address": "123 ถนนสุขุมวิท...",
  "recipient_name": "คุณสมชาย สมิท",
  "recipient_phone": "02-123-4567",
  "delivery_date": "2025-01-22",
  "notes": "ห่อด้วยพลาสติกกันน้ำ"
}
```

### PUT /api/delivery-notes/:id/update-tracking
### POST /api/delivery-notes/:id/mark-delivered
### GET /api/delivery-notes/:id/tracking-timeline

## 🔐 Permissions
- **Sales**: ดูสถานะ อัปเดตการติดตาม ยืนยันการส่งสำเร็จ
- **Account**: สร้าง แก้ไข จัดการทั้งหมด

## ✅ Acceptance Criteria
1. สร้างใบส่งของจากใบเสร็จได้
2. เลือกวิธีการส่งได้ (ส่งเอง/ขนส่ง/ลูกค้ารับ)
3. Integration กับ API ขนส่งหลักๆ
4. ติดตามสถานะ real-time ได้
5. แสดง timeline การส่งได้
6. Sales อัปเดตสถานะและยืนยันการส่งสำเร็จได้
7. สรุปงานและกำไรขาดทุนได้

## 🚀 AI Command
```bash
สร้างระบบใบส่งของพร้อมติดตามสถานะการจัดส่ง 
รองรับการส่งด้วยตัวเอง บริษัทขนส่ง และลูกค้ามารับเอง
พร้อม timeline tracking และ integration กับระบบขนส่ง
```
