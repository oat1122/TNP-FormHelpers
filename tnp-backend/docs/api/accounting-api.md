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
