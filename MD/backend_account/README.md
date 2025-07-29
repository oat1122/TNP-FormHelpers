# TNP Accounting System

ระบบบัญชีสำหรับ TNP FormHelpers ที่ได้รับแรงบันดาลใจจาก FlowAccount โดยรองรับการออกเอกสาร 4 ประเภท (ใบเสนอราคา, ใบวางบิล/ใบแจ้งหนี้, ใบเสร็จ/ใบกำกับภาษี, ใบส่งของ) และมีความยืดหยุ่นในการแก้ไข/ย้อนกลับ

## Features

### Core Functionality
- ✅ **Quotation Management** - จัดการใบเสนอราคา
- ✅ **Invoice Management** - จัดการใบแจ้งหนี้
- ✅ **Receipt Management** - จัดการใบเสร็จ/ใบกำกับภาษี
- ✅ **Delivery Note Management** - จัดการใบส่งของ
- ✅ **Customer Management** - จัดการข้อมูลลูกค้า
- ✅ **Product Management** - จัดการข้อมูลสินค้า

### Document Features
- ✅ **Auto Document Numbers** - เลขที่เอกสารอัตโนมัติ (QT202501-0001)
- ✅ **Status Tracking** - ติดตามสถานะเอกสาร
- ✅ **Audit Trail** - บันทึกประวัติการแก้ไข
- ✅ **File Attachments** - แนบไฟล์เอกสาร
- ✅ **Multi-currency Support** - รองรับหลายสกุลเงิน
- ✅ **VAT/WHT Calculation** - คำนวณภาษีมูลค่าเพิ่ม/หัก ณ ที่จ่าย

### Workflow Features
- ✅ **Role-based Access** - สิทธิ์ตามบทบาท (Sales/Account)
- ✅ **Approval Process** - กระบวนการอนุมัติ
- ✅ **Document Conversion** - แปลงเอกสารระหว่างประเภท
- ✅ **Payment Tracking** - ติดตามการชำระเงิน
- ✅ **Overdue Management** - จัดการเอกสารเกินกำหนด

## API Endpoints

### Dashboard
```
GET /api/v1/accounting/dashboard/summary
GET /api/v1/accounting/dashboard/revenue-chart
```

### Customers
```
GET    /api/v1/accounting/customers
POST   /api/v1/accounting/customers
GET    /api/v1/accounting/customers/{id}
PUT    /api/v1/accounting/customers/{id}
DELETE /api/v1/accounting/customers/{id}
GET    /api/v1/accounting/customers/{id}/summary
```

### Products
```
GET    /api/v1/accounting/products
POST   /api/v1/accounting/products
GET    /api/v1/accounting/products/categories
GET    /api/v1/accounting/products/low-stock
GET    /api/v1/accounting/products/{id}
PUT    /api/v1/accounting/products/{id}
DELETE /api/v1/accounting/products/{id}
PATCH  /api/v1/accounting/products/{id}/stock
```

### Quotations
```
GET    /api/v1/quotations
POST   /api/v1/quotations
GET    /api/v1/quotations/{id}
PUT    /api/v1/quotations/{id}
DELETE /api/v1/quotations/{id}
PATCH  /api/v1/quotations/{id}/status
GET    /api/v1/quotations/{id}/pdf
GET    /api/v1/quotations/{id}/history
```

### Invoices
```
GET    /api/v1/invoices
POST   /api/v1/invoices
GET    /api/v1/invoices/overdue
GET    /api/v1/invoices/{id}
PUT    /api/v1/invoices/{id}
DELETE /api/v1/invoices/{id}
PATCH  /api/v1/invoices/{id}/status
POST   /api/v1/invoices/{id}/payment
GET    /api/v1/invoices/{id}/pdf
GET    /api/v1/invoices/{id}/history
```

### Receipts
```
GET    /api/v1/receipts
POST   /api/v1/receipts
GET    /api/v1/receipts/{id}
PUT    /api/v1/receipts/{id}
DELETE /api/v1/receipts/{id}
PATCH  /api/v1/receipts/{id}/status
GET    /api/v1/receipts/{id}/pdf
GET    /api/v1/receipts/{id}/history
```

### Delivery Notes
```
GET    /api/v1/delivery-notes
POST   /api/v1/delivery-notes
POST   /api/v1/delivery-notes/partial
GET    /api/v1/delivery-notes/pending
GET    /api/v1/delivery-notes/customer/{customerId}/summary
GET    /api/v1/delivery-notes/{id}
PUT    /api/v1/delivery-notes/{id}
DELETE /api/v1/delivery-notes/{id}
PATCH  /api/v1/delivery-notes/{id}/status
GET    /api/v1/delivery-notes/{id}/pdf
GET    /api/v1/delivery-notes/{id}/history
```

### Document Attachments
```
POST   /api/v1/accounting/attachments/upload
GET    /api/v1/accounting/attachments/document
GET    /api/v1/accounting/attachments/stats
GET    /api/v1/accounting/attachments/{id}
GET    /api/v1/accounting/attachments/{id}/download
PUT    /api/v1/accounting/attachments/{id}/description
DELETE /api/v1/accounting/attachments/{id}
```

## Models

### Core Models
- `Customer` - ข้อมูลลูกค้า
- `Product` - ข้อมูลสินค้า
- `Quotation` - ใบเสนอราคา
- `QuotationItem` - รายการสินค้าในใบเสนอราคา
- `Invoice` - ใบแจ้งหนี้
- `InvoiceItem` - รายการสินค้าในใบแจ้งหนี้
- `Receipt` - ใบเสร็จ/ใบกำกับภาษี
- `ReceiptItem` - รายการสินค้าในใบเสร็จ
- `DeliveryNote` - ใบส่งของ
- `DeliveryNoteItem` - รายการสินค้าในใบส่งของ

### Supporting Models
- `DocumentStatusHistory` - ประวัติการเปลี่ยนสถานะ
- `DocumentAttachment` - ไฟล์แนบ

## Services

### QuotationService
- `generateQuotationNumber()` - สร้างเลขที่ใบเสนอราคา
- `createQuotation(array $data)` - สร้างใบเสนอราคา
- `updateQuotation(Quotation $quotation, array $data)` - แก้ไขใบเสนอราคา
- `changeStatus(Quotation $quotation, string $status, string $notes)` - เปลี่ยนสถานะ
- `getQuotations(array $filters)` - ดึงรายการใบเสนอราคา
- `getQuotationById(string $id)` - ดึงใบเสนอราคาตาม ID

### InvoiceService
- `generateInvoiceNumber()` - สร้างเลขที่ใบแจ้งหนี้
- `createInvoiceFromQuotation(Quotation $quotation, array $data)` - สร้างใบแจ้งหนี้จากใบเสนอราคา
- `recordPayment(Invoice $invoice, array $paymentData)` - บันทึกการชำระเงิน
- `updatePaymentStatus(Invoice $invoice)` - อัปเดตสถานะการชำระ

### DocumentService
- `recordStatusHistory(string $documentType, string $documentId, string $status, string $notes)` - บันทึกประวัติสถานะ
- `uploadAttachment(string $documentType, string $documentId, UploadedFile $file, string $description)` - อัปโหลดไฟล์แนบ
- `downloadAttachment(string $attachmentId)` - ดาวน์โหลดไฟล์แนบ

## Status Flow

### Quotation Status Flow
```
draft → pending_review → approved → completed
  ↓           ↓            ↓
rejected ← rejected ← rejected
```

### Invoice Status Flow
```
draft → pending_review → approved → completed
  ↓           ↓            ↓
rejected ← rejected ← rejected
```

### Payment Status Flow
```
unpaid → partially_paid → paid
   ↓
overdue (when due_date passed)
```

## Configuration

### config/accounting.php
```php
'default_vat_rate' => 7,
'document_formats' => [
    'quotation' => ['prefix' => 'QT', 'date_format' => 'Ym'],
    'invoice' => ['prefix' => 'INV', 'date_format' => 'Ym'],
],
'credit_terms' => [0 => 'Cash on Delivery', 30 => '30 Days'],
'currency' => ['default' => 'THB', 'symbol' => '฿'],
```

## Usage Examples

### Create Quotation
```php
$quotationService = new QuotationService();

$data = [
    'customer_id' => 'customer-uuid',
    'payment_terms' => 'Net 30',
    'deposit_amount' => 1000,
    'valid_until' => '2025-02-28',
    'tax_rate' => 7,
    'items' => [
        [
            'product_name' => 'Product A',
            'quantity' => 2,
            'unit_price' => 1000,
            'unit' => 'ชิ้น'
        ]
    ]
];

$quotation = $quotationService->createQuotation($data);
```

### Change Status
```php
$quotation = Quotation::find('quotation-id');
$quotationService->changeStatus(
    $quotation, 
    Quotation::STATUS_APPROVED, 
    'Approved by manager'
);
```

### Upload Attachment
```php
$documentService = new DocumentService();
$attachment = $documentService->uploadAttachment(
    'quotation',
    'quotation-id',
    $request->file('attachment'),
    'Contract document'
);
```

## Testing

Run tests for accounting module:
```bash
php artisan test tests/Feature/Accounting/
```

## Commands

### Update Invoice Payment Status
```bash
# Dry run to see what would be updated
php artisan accounting:update-invoice-status --dry-run

# Actually update statuses
php artisan accounting:update-invoice-status
```

## Security

- Role-based access control (Sales/Account roles)
- File upload validation (type, size limits)
- CSRF protection
- Rate limiting
- Audit trail for all changes

## Performance

- Database indexes on frequently queried fields
- Pagination for large datasets
- Background job processing for heavy operations
- Optimized queries with eager loading

## Integration

### Pricing System Integration
The accounting system integrates with the existing pricing system to pull completed pricing requests and convert them to quotations.

### Frontend Integration
Designed to work with React frontend using the provided API endpoints and JSON resources.

## Future Enhancements

- [ ] PDF generation service
- [ ] Email notifications
- [ ] e-Tax Invoice integration
- [ ] Multi-language support
- [ ] Advanced reporting
- [ ] Mobile app support
