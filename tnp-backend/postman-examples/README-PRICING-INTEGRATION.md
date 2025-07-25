# 🔗 Pricing Integration API Testing Guide

## 📋 การเชื่อมต่อระบบ Pricing กับ Accounting

ระบบนี้จะดึงข้อมูลจาก `pricing_requests`, `pricing_request_notes`, และ `master_customers` มาใช้ในการสร้างใบเสนอราคาอัตโนมัติ

---

## 🚀 API Endpoints

### 1. **GET** `/api/v1/pricing-integration/completed-requests` - ดึงงานที่เสร็จแล้ว

**URL:** `http://localhost:8000/api/v1/pricing-integration/completed-requests`

**Query Parameters:**
- `customer_id` - UUID ของลูกค้า
- `search` - ค้นหาตามเลขที่เอกสาร, ชื่องาน, ชื่อลูกค้า
- `date_from` - วันที่เริ่มต้น (YYYY-MM-DD)
- `date_to` - วันที่สิ้นสุด (YYYY-MM-DD)
- `per_page` - จำนวนรายการต่อหน้า

**Response:**
```json
{
  "status": "success",
  "message": "Completed pricing requests retrieved successfully",
  "data": {
    "current_page": 1,
    "data": [
      {
        "pr_id": "pricing-request-uuid",
        "pr_no": "P2025-07-0001",
        "pr_work_name": "เสื้อโปโลสีขาว",
        "pr_quantity": "100",
        "pr_status_id": "20db8be1-092b-11f0-b223-38ca84abdf0a",
        "status": "ได้ราคาแล้ว",
        "pricingCustomer": {
          "cus_name": "บริษัท ตัวอย่าง จำกัด",
          "cus_company": "Example Company Ltd.",
          "cus_email": "contact@example.com"
        },
        "note_price": [
          {
            "prn_text": "ราคา 150 บาทต่อตัว รวม 15,000 บาท",
            "prn_created_date": "2025-07-25T10:00:00.000000Z"
          }
        ]
      }
    ],
    "total": 1
  }
}
```

---

### 2. **GET** `/api/v1/pricing-integration/requests/{id}` - ดูรายละเอียดงาน

**URL:** `http://localhost:8000/api/v1/pricing-integration/requests/pricing-request-uuid`

**Response:**
```json
{
  "status": "success",
  "message": "Pricing request details retrieved successfully",
  "data": {
    "pricing_request": {
      "id": "pricing-request-uuid",
      "no": "P2025-07-0001",
      "work_name": "เสื้อโปโลสีขาว",
      "quantity": "100",
      "due_date": "2025-08-15T00:00:00.000000Z",
      "latest_price": 15000.00
    },
    "customer": {
      "id": "customer-uuid",
      "name": "บริษัท ตัวอย่าง จำกัด",
      "company": "Example Company Ltd.",
      "email": "contact@example.com",
      "phone": "02-123-4567"
    },
    "items": [
      {
        "item_name": "เสื้อโปโลสีขาว",
        "item_description": "แพทเทิร์น: Basic Polo, ผ้า: Cotton 100%, สี: ขาว, ไซส์: M,L,XL",
        "quantity": 100,
        "unit": "ชิ้น",
        "unit_price": 150.00
      },
      {
        "item_name": "งานปัก",
        "item_description": "ปัก Logo หน้าอก",
        "quantity": 100,
        "unit": "จุด",
        "unit_price": 0
      }
    ],
    "notes": [
      {
        "type": 2,
        "text": "ราคา 150 บาทต่อตัว รวม 15,000 บาท",
        "created_date": "2025-07-25T10:00:00.000000Z",
        "created_by": "Manager"
      }
    ]
  }
}
```

---

### 3. **POST** `/api/v1/pricing-integration/create-quotation` - สร้างใบเสนอราคา

**URL:** `http://localhost:8000/api/v1/pricing-integration/create-quotation`

**Body (JSON):**
```json
{
  "pricing_request_id": "pricing-request-uuid",
  "valid_until": "2025-08-25",
  "deposit_amount": 7500.00,
  "payment_terms": "มัดจำ 50% เริ่มงาน เก็บเงินส่วนที่เหลือเมื่อส่งของ",
  "remarks": "สร้างจากระบบ Pricing โดยอัตโนมัติ",
  "items": [
    {
      "item_name": "เสื้อโปโลสีขาว",
      "item_description": "แพทเทิร์น: Basic Polo, ผ้า: Cotton 100%, สี: ขาว, ไซส์: M,L,XL",
      "quantity": 100,
      "unit": "ชิ้น",
      "unit_price": 150.00
    }
  ]
}
```

**หมายเหตุ:** หาก `items` ไม่ได้ส่งมา ระบบจะสร้างรายการอัตโนมัติจากข้อมูล pricing request

**Response:**
```json
{
  "status": "success",
  "message": "Quotation created successfully from pricing request",
  "data": {
    "id": "quotation-uuid",
    "quotation_no": "QT202507-0001",
    "pricing_request_id": "pricing-request-uuid",
    "customer_id": "customer-uuid",
    "status": "draft",
    "subtotal": 15000.00,
    "tax_rate": 7.00,
    "tax_amount": 1050.00,
    "total_amount": 16050.00,
    "deposit_amount": 7500.00,
    "remaining_amount": 8550.00,
    "valid_until": "2025-08-25",
    "items": [...],
    "customer": {...},
    "pricingRequest": {...}
  }
}
```

---

### 4. **GET** `/api/v1/pricing-integration/requests/{id}/summary` - สรุปข้อมูลงาน

**URL:** `http://localhost:8000/api/v1/pricing-integration/requests/pricing-request-uuid/summary`

**Response:**
```json
{
  "status": "success",
  "message": "Pricing request summary retrieved successfully",
  "data": {
    "pricing_request": {
      "id": "pricing-request-uuid",
      "no": "P2025-07-0001",
      "work_name": "เสื้อโปโลสีขาว",
      "quantity": "100",
      "latest_price": 15000.00
    },
    "customer": {
      "id": "customer-uuid",
      "name": "บริษัท ตัวอย่าง จำกัด",
      "company": "Example Company Ltd.",
      "email": "contact@example.com",
      "phone": "02-123-4567",
      "address": "123 ถนนตัวอย่าง กรุงเทพฯ",
      "tax_id": "0123456789012"
    },
    "items": [...],
    "notes": [...],
    "can_create_quotation": true
  }
}
```

---

## 📊 Flow การทำงาน

### 1. **ดึงงานที่เสร็จแล้ว:**
```
GET /pricing-integration/completed-requests
→ แสดงรายการงานที่สถานะ "ได้ราคาแล้ว" หรือ "Complete"
→ กรองเฉพาะงานที่ยังไม่ได้สร้างใบเสนอราคา
```

### 2. **ดูรายละเอียดงาน:**
```
GET /pricing-integration/requests/{id}
→ ดึงข้อมูลครบถ้วนจาก pricing_requests
→ ดึงข้อมูลลูกค้าจาก master_customers
→ ดึงราคาล่าสุดจาก pricing_request_notes
→ สร้างรายการสินค้าแนะนำ
```

### 3. **สร้างใบเสนอราคา:**
```
POST /pricing-integration/create-quotation
→ ตรวจสอบสิทธิ์การสร้าง
→ สร้าง Quotation และ QuotationItems
→ คำนวณราคารวมและภาษี
→ บันทึกประวัติการเปลี่ยนแปลง
```

---

## 🔍 Logic การดึงราคา

ระบบจะดึงราคาจาก `pricing_request_notes` ที่:
- `prn_note_type = 2` (ประเภทราคา)
- `prn_is_deleted = false`
- เรียงตาม `prn_created_date` จากใหม่ไปเก่า

**รูปแบบราคาที่รองรับ:**
- "ราคา 150 บาทต่อตัว"
- "15,000 บาท"
- "150.00"
- "15000"

---

## ⚠️ เงื่อนไขการสร้างใบเสนอราคา

1. **สถานะงาน:** ต้องเป็น "ได้ราคาแล้ว" หรือ "Complete"
2. **ข้อมูลลูกค้า:** ต้องมีข้อมูลลูกค้าที่ใช้งานได้
3. **ไม่ซ้ำ:** ยังไม่เคยสร้างใบเสนอราคาจากงานนี้
4. **ไม่ถูกลบ:** `pr_is_deleted = false`

---

## 💡 ตัวอย่างการใช้งาน

### **Step 1: ดึงรายการงาน**
```bash
curl -X GET "http://localhost:8000/api/v1/pricing-integration/completed-requests" \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Accept: application/json"
```

### **Step 2: ดูรายละเอียด**
```bash
curl -X GET "http://localhost:8000/api/v1/pricing-integration/requests/PRICING_ID" \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Accept: application/json"
```

### **Step 3: สร้างใบเสนอราคา**
```bash
curl -X POST "http://localhost:8000/api/v1/pricing-integration/create-quotation" \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "pricing_request_id": "PRICING_ID",
  "valid_until": "2025-08-25",
  "deposit_amount": 7500
}'
```

---

## 🎯 Status Codes ที่ใช้

- `20db8be1-092b-11f0-b223-38ca84abdf0a` = "ได้ราคาแล้ว"
- `20db8c1d-092b-11f0-b223-38ca84abdf0a` = "Complete"

การเชื่อมต่อนี้จะทำให้ระบบ Accounting สามารถดึงข้อมูลจากระบบ Pricing มาใช้ได้อย่างมีประสิทธิภาพ! 🚀
