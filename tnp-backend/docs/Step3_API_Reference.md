# Step 3: Receipt Flow API Reference

> **API Version**: v1  
> **Base URL**: `/api/v1`  
> **Authentication**: Bearer Token (Sanctum)

## 📚 Table of Contents

1. [Receipt CRUD Operations](#receipt-crud-operations)
2. [Workflow Actions](#workflow-actions)
3. [Payment Processing](#payment-processing)
4. [Utility Endpoints](#utility-endpoints)
5. [Response Examples](#response-examples)
6. [Error Codes](#error-codes)

---

## Receipt CRUD Operations

### GET /receipts
Get list of receipts with optional filters

**Query Parameters:**
```
search         (string)   - Search by receipt number, customer, or work name
status         (string)   - Filter by status: draft,pending,approved,rejected
receipt_type   (string)   - Filter by type: receipt,tax_invoice,full_tax_invoice
customer_id    (string)   - Filter by customer UUID
payment_method (string)   - Filter by method: cash,transfer,check,credit_card
date_from      (date)     - Filter from date (YYYY-MM-DD)
date_to        (date)     - Filter to date (YYYY-MM-DD)
per_page       (integer)  - Items per page (max 50, default 20)
```

**Response:**
```json
{
    "success": true,
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": "uuid",
                "receipt_number": "RCP-2024-0001",
                "tax_invoice_number": "TX-2024-0001",
                "receipt_type": "tax_invoice",
                "customer_company": "บริษัท ABC จำกัด",
                "work_name": "ตัดเสื้อโปโล 100 ตัว",
                "total_amount": 1070.00,
                "payment_method": "transfer",
                "status": "approved",
                "created_at": "2024-01-15T10:30:00.000000Z"
            }
        ],
        "total": 25,
        "per_page": 20
    }
}
```

### GET /receipts/{id}
Get specific receipt details

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "receipt_number": "RCP-2024-0001",
        "tax_invoice_number": "TX-2024-0001",
        "receipt_type": "tax_invoice",
        "invoice_id": "invoice-uuid",
        "customer_company": "บริษัท ABC จำกัด",
        "customer_address": "123 ถนนสุขุมวิท กรุงเทพฯ 10110",
        "customer_tax_id": "1234567890123",
        "work_name": "ตัดเสื้อโปโล 100 ตัว",
        "payment_amount": 1070.00,
        "payment_date": "2024-01-15",
        "payment_method": "transfer",
        "reference_number": "REF123456",
        "bank_name": "ธนาคารกสิกรไทย",
        "subtotal": 1000.00,
        "vat_amount": 70.00,
        "total_amount": 1070.00,
        "status": "approved",
        "notes": "ชำระเงินครบถ้วนแล้ว",
        "invoice": {
            "id": "invoice-uuid",
            "invoice_number": "INV-2024-0001"
        },
        "documentHistory": [...],
        "documentAttachments": [...]
    }
}
```

### POST /receipts
Create manual receipt

**Request Body:**
```json
{
    "customer_company": "บริษัท ABC จำกัด",
    "customer_address": "123 ถนนสุขุมวิท กรุงเทพฯ 10110",
    "customer_tax_id": "1234567890123",
    "work_name": "ตัดเสื้อโปโล 100 ตัว",
    "payment_amount": 1070.00,
    "payment_date": "2024-01-15",
    "payment_method": "transfer",
    "receipt_type": "tax_invoice",
    "reference_number": "REF123456",
    "bank_name": "ธนาคารกสิกรไทย",
    "subtotal": 1000.00,
    "vat_amount": 70.00,
    "total_amount": 1070.00,
    "notes": "ชำระเงินครบถ้วน"
}
```

### PUT /receipts/{id}
Update receipt (draft status only)

**Request Body:** Same as POST (all fields optional)

### DELETE /receipts/{id}
Delete receipt (draft status only)

---

## Workflow Actions

### POST /receipts/{id}/submit
Submit receipt for approval

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "status": "pending",
        "submitted_at": "2024-01-15T10:30:00.000000Z",
        "submitted_by": "user-uuid"
    },
    "message": "Receipt submitted for approval successfully"
}
```

### POST /receipts/{id}/approve
Approve receipt

**Request Body:**
```json
{
    "notes": "อนุมัติแล้ว เอกสารครบถ้วน"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "status": "approved",
        "approved_at": "2024-01-15T11:00:00.000000Z",
        "approved_by": "approver-uuid"
    },
    "message": "Receipt approved successfully"
}
```

### POST /receipts/{id}/reject
Reject receipt

**Request Body:**
```json
{
    "reason": "ข้อมูลการชำระเงินไม่ถูกต้อง กรุณาตรวจสอบ"
}
```

---

## Payment Processing

### POST /receipts/create-from-payment
🔥 **ONE-CLICK** Create receipt from payment

**Request Body:**
```json
{
    "invoice_id": "invoice-uuid",
    "amount": 1070.00,
    "payment_date": "2024-01-15",
    "payment_method": "transfer",
    "receipt_type": "tax_invoice",
    "reference_number": "REF123456",
    "bank_name": "ธนาคารกสิกรไทย",
    "notes": "ชำระเงินครบถ้วน"
}
```

**Auto-Generated Fields:**
- Receipt number (RCP-YYYY-NNNN)
- Tax invoice number (TX-YYYY-NNNN) 
- VAT calculation
- Customer data from invoice
- Work details from invoice

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "new-receipt-uuid",
        "receipt_number": "RCP-2024-0002",
        "tax_invoice_number": "TX-2024-0002",
        "customer_company": "บริษัท ABC จำกัด",
        "subtotal": 1000.00,
        "vat_amount": 70.00,
        "total_amount": 1070.00,
        "status": "draft"
    },
    "message": "Receipt created from payment successfully"
}
```

### POST /receipts/{id}/upload-evidence
Upload payment evidence files

**Request Body:** (multipart/form-data)
```
files[]        (file)    - Payment evidence files (JPG,PNG,PDF, max 5MB each)
description    (string)  - Optional description
```

**Response:**
```json
{
    "success": true,
    "data": {
        "uploaded_files": [
            {
                "id": "attachment-uuid",
                "filename": "payment_slip.jpg",
                "original_name": "หลักฐานการโอนเงิน.jpg",
                "size": 1024000,
                "mime_type": "image/jpeg"
            }
        ]
    },
    "message": "Evidence uploaded successfully"
}
```

---

## Utility Endpoints

### GET /receipts/calculate-vat
Calculate VAT for given amount and receipt type

**Query Parameters:**
```
amount         (number)  - Amount to calculate VAT for
receipt_type   (string)  - receipt|tax_invoice|full_tax_invoice
```

**Response:**
```json
{
    "success": true,
    "data": {
        "total_amount": 1070,
        "subtotal": 1000,
        "vat_rate": 0.07,
        "vat_amount": 70,
        "has_vat": true
    }
}
```

### GET /receipts/types
Get available receipt types

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "value": "receipt",
            "label": "ใบเสร็จธรรมดา",
            "description": "ใบเสร็จสำหรับลูกค้าที่ไม่มีเลขภาษี",
            "has_vat": false
        },
        {
            "value": "tax_invoice", 
            "label": "ใบกำกับภาษี",
            "description": "ใบกำกับภาษีสำหรับลูกค้าที่มีเลขภาษี",
            "has_vat": true
        },
        {
            "value": "full_tax_invoice",
            "label": "ใบกำกับภาษี/ใบเสร็จ", 
            "description": "ใบกำกับภาษีเต็มรูปแบบ",
            "has_vat": true
        }
    ]
}
```

### GET /receipts/payment-methods
Get available payment methods

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "value": "cash",
            "label": "เงินสด",
            "requires_reference": false,
            "requires_bank": false
        },
        {
            "value": "transfer",
            "label": "โอนเงิน", 
            "requires_reference": true,
            "requires_bank": true
        },
        {
            "value": "check",
            "label": "เช็ค",
            "requires_reference": true,
            "requires_bank": true
        },
        {
            "value": "credit_card",
            "label": "บัตรเครดิต",
            "requires_reference": true,
            "requires_bank": false
        }
    ]
}
```

### GET /receipts/{id}/generate-pdf
Generate PDF receipt/tax invoice

**Response:**
```json
{
    "success": true,
    "data": {
        "pdf_url": "/storage/receipts/pdfs/RCP-2024-0001.pdf",
        "filename": "ใบเสร็จ_RCP-2024-0001.pdf",
        "size": 245760
    }
}
```

---

## Error Codes

### HTTP Status Codes:
- **200** - Success
- **201** - Created successfully  
- **400** - Bad Request (validation failed)
- **401** - Unauthorized
- **403** - Forbidden (permission denied)
- **404** - Not Found
- **422** - Validation Error
- **500** - Internal Server Error

### Common Error Response:
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "amount": ["The amount field is required."],
        "payment_date": ["The payment date field is required."]
    }
}
```

### Business Logic Errors:
```json
{
    "success": false,
    "message": "Only draft receipts can be deleted"
}
```

---

## 🧪 Testing Examples

### cURL Examples:

#### Get Receipts List:
```bash
curl -X GET "http://localhost:8000/api/v1/receipts?status=approved&per_page=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### Create Receipt from Payment:
```bash
curl -X POST "http://localhost:8000/api/v1/receipts/create-from-payment" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "invoice_id": "9d285ff4-8b3e-4c5a-9f2e-1a3b4c5d6e7f",
    "amount": 1070.00,
    "payment_date": "2024-01-15",
    "payment_method": "transfer",
    "receipt_type": "tax_invoice",
    "reference_number": "REF123456",
    "bank_name": "ธนาคารกสิกรไทย"
  }'
```

#### Calculate VAT:
```bash
curl -X GET "http://localhost:8000/api/v1/receipts/calculate-vat?amount=1070&receipt_type=tax_invoice" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

---

**Step 3 Receipt Flow APIs** - Complete and Ready for Frontend Integration! 🚀
