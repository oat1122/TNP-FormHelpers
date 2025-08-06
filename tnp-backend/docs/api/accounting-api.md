# TNP Accounting API Documentation

## Step 0: Pricing Integration APIs

### 1. Get Completed Pricing Requests
**Endpoint:** `GET /api/v1/pricing/completed-requests`

**Purpose:** ดึงรายการ Pricing Request ที่สถานะ Complete สำหรับสร้างใบเสนอราคา

**Parameters:**
- `search` (optional): ค้นหาตามชื่องาน, บริษัท, หรือรายละเอียดงาน
- `customer_id` (optional): กรองตามลูกค้า
- `work_name` (optional): กรองตามชื่องาน
- `date_from` (optional): วันที่เริ่มต้น (YYYY-MM-DD)
- `date_to` (optional): วันที่สิ้นสุด (YYYY-MM-DD)
- `per_page` (optional): จำนวนรายการต่อหน้า (default: 20, max: 50)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "pr_id": "pr-2025-001",
        "pr_work_name": "งานพิมพ์โบรชัวร์ A4 4 สี",
        "pr_cus_id": "cus-123",
        "pr_pattern": "A4 Brochure",
        "pr_fabric_type": "Premium Paper",
        "pr_color": "4 สี",
        "pr_sizes": "A4",
        "pr_quantity": "2",
        "pr_due_date": "2025-01-30",
        "pr_status": "Complete",
        "pr_completed_at": "2025-01-15T00:00:00Z",
        "customer": {
          "cus_id": "cus-123",
          "cus_company": "บริษัท ABC จำกัด",
          "cus_tax_id": "0123456789012",
          "cus_address": "123 ถนนสุขุมวิท",
          "cus_zip_code": "10110",
          "cus_tel_1": "02-123-4567",
          "cus_email": "contact@abc-company.com",
          "cus_firstname": "สมชาย",
          "cus_lastname": "ใจดี"
        }
      }
    ],
    "pagination": {
      "total": 5,
      "per_page": 20,
      "current_page": 1,
      "last_page": 1,
      "from": 1,
      "to": 5
    }
  },
  "message": "Completed pricing requests retrieved successfully"
}
```

### 2. Get Auto-fill Data from Pricing Request
**Endpoint:** `GET /api/v1/quotations/autofill/pricing-request/{id}`

**Purpose:** ดึงข้อมูลสำหรับ Auto-fill ใบเสนอราคาจาก Pricing Request

**Response Example:**
```json
{
  "success": true,
  "data": {
    "pr_id": "pr-2025-001",
    "pr_work_name": "งานพิมพ์โบรชัวร์ A4 4 สี",
    "pr_pattern": "A4 Brochure",
    "pr_fabric_type": "Premium Paper",
    "pr_color": "4 สี",
    "pr_sizes": "A4",
    "pr_quantity": "2",
    "pr_due_date": "2025-01-30",
    "pr_silk": null,
    "pr_dft": null,
    "pr_embroider": null,
    "pr_sub": null,
    "pr_other_screen": null,
    "pr_image": "https://domain.com/storage/images/pricing_req/image.jpg",
    "pr_cus_id": "cus-123",
    "cus_company": "บริษัท ABC จำกัด",
    "cus_tax_id": "0123456789012",
    "cus_address": "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ",
    "cus_zip_code": "10110",
    "cus_tel_1": "02-123-4567",
    "cus_email": "contact@abc-company.com",
    "cus_firstname": "สมชาย",
    "cus_lastname": "ใจดี",
    "initial_notes": "[Sale] ลูกค้าต้องการคุณภาพพิเศษ\n[Price] ราคาตามเสนอ",
    "notes": [
      {
        "prn_id": "note-1",
        "prn_text": "ลูกค้าต้องการคุณภาพพิเศษ",
        "prn_note_type": 1,
        "note_type_label": "Sale",
        "prn_created_by": "user-123",
        "prn_created_date": "2025-01-10T10:00:00Z",
        "created_name": "Sale Rep"
      }
    ]
  },
  "message": "Auto-fill data retrieved successfully"
}
```

### 3. Mark Pricing Request as Used
**Endpoint:** `POST /api/v1/pricing/requests/{id}/mark-used`

**Purpose:** มาร์ค Pricing Request ว่าใช้แล้วสำหรับสร้างใบเสนอราคา

**Response Example:**
```json
{
  "success": true,
  "data": {
    "pr_id": "pr-2025-001",
    "marked_at": "2025-01-15T14:30:00Z",
    "marked_by": "user-456"
  },
  "message": "Pricing request marked as used successfully"
}
```

### 4. Create Quotation from Pricing Request
**Endpoint:** `POST /api/v1/quotations/create-from-pricing`

**Purpose:** สร้างใบเสนอราคาจาก Pricing Request (พร้อม Auto-fill ข้อมูล)

**Request Body:**
```json
{
  "pricing_request_id": "pr-2025-001",
  "subtotal": 2000.00,
  "tax_amount": 140.00,
  "total_amount": 2140.00,
  "deposit_percentage": 50,
  "payment_terms": "credit_30_days",
  "notes": "ราคานี้รวมค่าจัดส่งและติดตั้งแล้ว"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "quo-uuid-001",
    "number": "QUO2025-001",
    "pricing_request_id": "pr-2025-001",
    "customer_company": "บริษัท ABC จำกัด",
    "work_name": "งานพิมพ์โบรชัวร์ A4 4 สี",
    "status": "draft",
    "subtotal": 2000.00,
    "tax_amount": 140.00,
    "total_amount": 2140.00,
    "deposit_percentage": 50,
    "deposit_amount": 1070.00,
    "created_at": "2025-01-15T14:30:00Z"
  },
  "message": "Quotation created from pricing request successfully"
}
```

## Auto-fill Helper APIs

### 5. Search Customers (Auto-complete)
**Endpoint:** `GET /api/v1/customers/search`

**Parameters:**
- `q`: คำค้นหา (minimum 2 characters)
- `limit`: จำนวนผลลัพธ์ (default: 10, max: 50)

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "cus_id": "cus-123",
      "cus_company": "บริษัท ABC จำกัด",
      "cus_fullname": "สมชาย ใจดี",
      "cus_tel_1": "02-123-4567",
      "cus_email": "contact@abc-company.com"
    }
  ],
  "message": "Customers retrieved successfully"
}
```

### 6. Get Customer Auto-fill Details
**Endpoint:** `GET /api/v1/customers/{id}/details`

**Purpose:** ดึงข้อมูลลูกค้าสำหรับ Auto-fill

**Response Example:**
```json
{
  "success": true,
  "data": {
    "cus_id": "cus-123",
    "cus_company": "บริษัท ABC จำกัด",
    "cus_tax_id": "0123456789012",
    "cus_address": "123 ถนนสุขุมวิท",
    "cus_zip_code": "10110",
    "cus_tel_1": "02-123-4567",
    "cus_tel_2": "02-123-4568",
    "cus_email": "contact@abc-company.com",
    "cus_firstname": "สมชาย",
    "cus_lastname": "ใจดี",
    "cus_depart": "ฝ่ายจัดซื้อ",
    "recent_pricing_requests": [
      {
        "pr_id": "pr-2025-001",
        "pr_work_name": "งานพิมพ์โบรชัวร์",
        "pr_created_date": "2025-01-10T00:00:00Z"
      }
    ]
  },
  "message": "Customer details retrieved successfully"
}
```

## Cascade Auto-fill APIs

### 7. Get Quotation Auto-fill for Invoice
**Endpoint:** `GET /api/v1/invoices/autofill/quotation/{id}`

### 8. Get Invoice Auto-fill for Receipt
**Endpoint:** `GET /api/v1/receipts/autofill/invoice/{id}`

### 9. Get Receipt Auto-fill for Delivery Note
**Endpoint:** `GET /api/v1/delivery-notes/autofill/receipt/{id}`

## Error Responses

**Validation Error (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "pricing_request_id": ["The pricing request id field is required."]
  }
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "message": "Pricing Request not found"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "Failed to retrieve completed pricing requests: Database connection error"
}
```

## Authentication

All APIs require authentication using Laravel Sanctum:
- Header: `Authorization: Bearer {token}`
- Cookie-based session authentication (for web)

## Rate Limiting

- API calls are limited to 100 requests per minute per user
- Heavy operations (like file uploads) are limited to 10 requests per minute

## Permissions

Based on user roles:
- **Sales**: Can create quotations from pricing requests
- **Account**: Full access to accounting system
- **Manager**: Can approve and manage all documents
- **Admin**: Full system access

---

## Step 2: Invoice Flow APIs

### 1. One-Click Conversion from Quotation
**Endpoint:** `POST /api/v1/invoices/create-from-quotation`

**Purpose:** แปลงใบเสนอราคาเป็นใบแจ้งหนี้แบบ One-Click

**Request Body:**
```json
{
  "quotation_id": "quot-uuid-123",
  "type": "remaining",
  "custom_amount": 25000.00,
  "payment_terms": "30 วัน",
  "notes": "หมายเหตุเพิ่มเติม"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "inv-uuid-456",
    "number": "INV202501-0123",
    "quotation_id": "quot-uuid-123",
    "type": "remaining",
    "customer_company": "บริษัท ABC จำกัด",
    "work_name": "งานพิมพ์โบรชัวร์ A4 4 สี",
    "subtotal": 23364.49,
    "tax_amount": 1635.51,
    "total_amount": 25000.00,
    "due_date": "2025-02-20",
    "status": "draft"
  },
  "message": "Invoice created from quotation successfully"
}
```

### 2. Record Payment
**Endpoint:** `POST /api/v1/invoices/{id}/record-payment`

**Purpose:** บันทึกการชำระเงิน

**Request Body:**
```json
{
  "amount": 15000.00,
  "payment_method": "โอนเงิน",
  "reference_number": "TXN123456",
  "payment_date": "2025-01-20",
  "notes": "ชำระผ่านธนาคาร XYZ"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "inv-uuid-456",
    "number": "INV202501-0123",
    "total_amount": 25000.00,
    "paid_amount": 15000.00,
    "remaining_amount": 10000.00,
    "status": "partial_paid",
    "payment_history": [
      {
        "amount": 15000.00,
        "payment_method": "โอนเงิน",
        "reference_number": "TXN123456",
        "recorded_at": "2025-01-20T10:30:00Z"
      }
    ]
  },
  "message": "Payment recorded successfully"
}
```

### 3. Get Payment History
**Endpoint:** `GET /api/v1/invoices/{id}/payment-history`

**Purpose:** ดูประวัติการชำระเงิน

**Response Example:**
```json
{
  "success": true,
  "data": {
    "invoice_id": "inv-uuid-456",
    "invoice_number": "INV202501-0123",
    "total_amount": 25000.00,
    "paid_amount": 15000.00,
    "remaining_amount": 10000.00,
    "payment_history": [
      {
        "id": "payment-1",
        "amount": 15000.00,
        "payment_method": "โอนเงิน",
        "reference_number": "TXN123456",
        "recorded_by": "user-123",
        "recorded_at": "2025-01-20T10:30:00Z",
        "notes": "ชำระผ่านธนาคาร XYZ"
      }
    ]
  },
  "message": "Payment history retrieved successfully"
}
```

### 4. Send Payment Reminder
**Endpoint:** `POST /api/v1/invoices/{id}/send-reminder`

**Purpose:** ส่งการแจ้งเตือนการชำระเงิน

**Request Body:**
```json
{
  "reminder_type": "gentle",
  "notes": "กรุณาชำระภายใน 7 วัน"
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Payment reminder sent successfully"
}
```

### 5. Invoice Status Management
**Submit for Approval:** `POST /api/v1/invoices/{id}/submit`
**Approve Invoice:** `POST /api/v1/invoices/{id}/approve`
**Reject Invoice:** `POST /api/v1/invoices/{id}/reject`
**Send Back:** `POST /api/v1/invoices/{id}/send-back`
**Send to Customer:** `POST /api/v1/invoices/{id}/send-to-customer`

### 6. Invoice List with Filters
**Endpoint:** `GET /api/v1/invoices`

**Query Parameters:**
- `search` - ค้นหาตามเลขที่, ชื่อบริษัท, หรือชื่องาน
- `status` - กรองตามสถานะ (draft, pending_review, approved, sent, partial_paid, fully_paid, overdue)
- `customer_id` - กรองตามลูกค้า
- `date_from`, `date_to` - กรองตามวันที่สร้าง
- `due_date_from`, `due_date_to` - กรองตามวันครบกำหนด
- `overdue=true` - แสดงเฉพาะใบแจ้งหนี้ที่เกินกำหนด
- `per_page` - จำนวนรายการต่อหน้า (max: 50)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "inv-uuid-456",
        "number": "INV202501-0123",
        "customer_company": "บริษัท ABC จำกัด",
        "work_name": "งานพิมพ์โบรชัวร์ A4 4 สี",
        "total_amount": 25000.00,
        "paid_amount": 15000.00,
        "remaining_amount": 10000.00,
        "status": "partial_paid",
        "due_date": "2025-02-20",
        "created_at": "2025-01-15T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "per_page": 20,
      "current_page": 1,
      "last_page": 3
    }
  },
  "message": "Invoices retrieved successfully"
}
```

---

## Invoice Types

### Type Values:
- `full_amount` - เรียกเก็บเต็มจำนวน
- `remaining` - เรียกเก็บส่วนที่เหลือหลังหักมัดจำ
- `deposit` - เรียกเก็บเงินมัดจำ
- `partial` - เรียกเก็บบางส่วน (ต้องระบุ custom_amount)

### Status Values:
- `draft` - ร่าง
- `pending_review` - รออนุมัติ
- `approved` - อนุมัติแล้ว
- `sent` - ส่งให้ลูกค้าแล้ว
- `partial_paid` - ชำระบางส่วน
- `fully_paid` - ชำระครบแล้ว
- `overdue` - เกินกำหนด (auto-detect)
- `rejected` - ถูกปฏิเสธ
