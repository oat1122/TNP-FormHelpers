# 📋 Quotations API Testing Guide

## 🚀 Quick Start

### 1. Authentication
ก่อนทดสอบ API ต้องได้ Token ก่อน:

**POST** `/api/v1/login`
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "token": "YOUR_BEARER_TOKEN_HERE",
    "user": {...}
  }
}
```

### 2. Headers สำหรับทุก Request
```
Authorization: Bearer YOUR_TOKEN_HERE
Accept: application/json
Content-Type: application/json
```

---

## 📝 API Endpoints Testing

### 1. **GET** `/api/v1/quotations` - ดึงรายการใบเสนอราคา

**URL:** `http://localhost:8000/api/v1/quotations`

**Query Parameters (Optional):**
- `status` - draft, pending_review, approved, rejected, completed
- `customer_id` - UUID ของลูกค้า
- `search` - ค้นหาตามชื่อลูกค้าหรือเลขที่เอกสาร
- `date_from` - วันที่เริ่มต้น (YYYY-MM-DD)
- `date_to` - วันที่สิ้นสุด (YYYY-MM-DD)
- `per_page` - จำนวนรายการต่อหน้า (default: 15)

**Example URL with params:**
```
http://localhost:8000/api/v1/quotations?status=draft&per_page=10
```

---

### 2. **POST** `/api/v1/quotations` - สร้างใบเสนอราคาใหม่

**URL:** `http://localhost:8000/api/v1/quotations`

**Body (JSON):**
```json
{
  "customer_id": "01234567-89ab-cdef-0123-456789abcdef",
  "pricing_request_id": "pricing-request-uuid-here",
  "quotation_date": "2025-07-25",
  "valid_until": "2025-08-25",
  "subtotal": 10000.00,
  "tax_rate": 7.00,
  "remarks": "หมายเหตุเพิ่มเติม",
  "items": [
    {
      "item_name": "เสื้อโปโล",
      "item_description": "เสื้อโปโลสีขาว ไซส์ M",
      "quantity": 100,
      "unit": "ตัว",
      "unit_price": 100.00
    },
    {
      "item_name": "การปัก Logo",
      "item_description": "ปัก Logo หน้าอก",
      "quantity": 100,
      "unit": "จุด",
      "unit_price": 0.00
    }
  ]
}
```

---

### 3. **GET** `/api/v1/quotations/{id}` - ดูรายละเอียดใบเสนอราคา

**URL:** `http://localhost:8000/api/v1/quotations/01234567-89ab-cdef-0123-456789abcdef`

*ไม่ต้องมี body*

---

### 4. **PUT** `/api/v1/quotations/{id}` - แก้ไขใบเสนอราคา

**URL:** `http://localhost:8000/api/v1/quotations/01234567-89ab-cdef-0123-456789abcdef`

**Body (JSON):**
```json
{
  "valid_until": "2025-09-25",
  "subtotal": 12000.00,
  "tax_rate": 7.00,
  "remarks": "หมายเหตุที่แก้ไขแล้ว",
  "items": [
    {
      "item_name": "เสื้อโปโล",
      "item_description": "เสื้อโปโลสีขาว ไซส์ M",
      "quantity": 120,
      "unit": "ตัว",
      "unit_price": 100.00
    }
  ]
}
```

---

### 5. **DELETE** `/api/v1/quotations/{id}` - ลบใบเสนอราคา

**URL:** `http://localhost:8000/api/v1/quotations/01234567-89ab-cdef-0123-456789abcdef`

*ไม่ต้องมี body*

**หมายเหตุ:** ลบได้เฉพาะสถานะ draft หรือ rejected เท่านั้น

---

### 6. **PATCH** `/api/v1/quotations/{id}/status` - เปลี่ยนสถานะ

**URL:** `http://localhost:8000/api/v1/quotations/01234567-89ab-cdef-0123-456789abcdef/status`

**Body (JSON):**
```json
{
  "status": "approved",
  "remarks": "อนุมัติแล้ว พร้อมดำเนินการต่อ"
}
```

**Available Status:**
- `draft` - ร่าง
- `pending_review` - รอตรวจสอบ
- `approved` - อนุมัติ
- `rejected` - ไม่อนุมัติ
- `completed` - เสร็จสิ้น

---

### 7. **GET** `/api/v1/quotations/{id}/pdf` - สร้าง PDF

**URL:** `http://localhost:8000/api/v1/quotations/01234567-89ab-cdef-0123-456789abcdef/pdf`

*ไม่ต้องมี body*

---

### 8. **GET** `/api/v1/quotations/{id}/history` - ดูประวัติการเปลี่ยนแปลง

**URL:** `http://localhost:8000/api/v1/quotations/01234567-89ab-cdef-0123-456789abcdef/history`

*ไม่ต้องมี body*

---

## ⚠️ Common Error Responses

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": "Quotation not found"
}
```

### 422 Validation Error
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "customer_id": ["The customer id field is required."],
    "items": ["The items field must have at least 1 items."]
  }
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "message": "Quotation cannot be edited in current status"
}
```

---

## 💡 Testing Tips

1. **เริ่มต้นด้วย GET** `/quotations` เพื่อดูว่าระบบทำงานได้หรือไม่
2. **สร้างข้อมูลทดสอบ** ด้วย POST ก่อนทดสอบ endpoints อื่น
3. **ใช้ UUID จริง** จากฐานข้อมูลสำหรับ customer_id และ pricing_request_id
4. **ตรวจสอบ Status Workflow** - บางสถานะไม่สามารถแก้ไขหรือลบได้
5. **ใช้ Postman Collection** - import ไฟล์ JSON ด้านบนเพื่อความสะดวก

---

## 🔧 Troubleshooting

**ถ้า Server ไม่ตอบสนอง:**
```bash
cd d:\01oat\TNP-FormHelpers\tnp-backend
php artisan serve
```

**ถ้าได้ Database Error:**
```bash
php artisan migrate
php artisan config:clear
php artisan route:clear
```

**ถ้า Authentication Error:**
- ตรวจสอบ Bearer Token ใน Headers
- ตรวจสอบว่า Token ยังไม่หมดอายุ
- Login ใหม่เพื่อได้ Token ใหม่
