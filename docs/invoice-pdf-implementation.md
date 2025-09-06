# Invoice PDF System Implementation

## 📋 ภาพรวม

ระบบ PDF สำหรับใบแจ้งหนี้/วางบิล ที่ใช้ mPDF เป็นหลัก พร้อม fallback mechanism และรองรับทั้งภาษาไทยและอังกฤษ

## 🚀 วิธีการใช้งาน

### 1. การสร้าง PDF ใบแจ้งหนี้

#### API Endpoints

```php
// สร้างและบันทึก PDF
GET|POST /api/v1/invoices/{id}/generate-pdf

// แสดง PDF ในเบราว์เซอร์ (inline)
GET /api/v1/invoices/{id}/pdf/stream

// ดาวน์โหลด PDF
GET /api/v1/invoices/{id}/pdf/download

// ตรวจสอบสถานะระบบ PDF
GET /api/v1/system/invoice-pdf-status
```

#### ตัวอย่างการใช้งานใน Frontend

```javascript
// การสร้าง PDF แบบ Dialog Preview
const handlePreviewPdf = async () => {
  if (!invoice?.id) return;
  
  try {
    const loadingId = showLoading('กำลังสร้าง PDF ใบแจ้งหนี้…');
    const res = await generateInvoicePDF(invoice.id).unwrap();
    const url = res?.pdf_url || res?.url;
    if (url) {
      setPdfUrl(url);
      setShowPdfViewer(true);
      showSuccess('สร้าง PDF สำเร็จ');
    }
    dismissToast(loadingId);
  } catch (e) {
    showError(e?.data?.message || e?.message || 'ไม่สามารถสร้าง PDF ได้');
  }
};

// การดาวน์โหลด PDF โดยตรง
const handleDownloadPdf = async () => {
  try {
    const url = `/api/v1/invoices/${invoice.id}/pdf/download`;
    window.open(url, '_blank');
  } catch (e) {
    showError('ไม่สามารถดาวน์โหลด PDF ได้');
  }
};
```

### 2. HTML Structure สำหรับ PDF Preview Dialog

```html
<!-- ปุ่มดาวน์โหลด PDF -->
<button 
  class="MuiButtonBase-root MuiButton-root MuiButton-outlined MuiButton-outlinedPrimary MuiButton-sizeSmall"
  onClick={handlePreviewPdf}
  aria-label="ดาวน์โหลดไฟล์ PDF"
>
  <span class="MuiButton-icon MuiButton-startIcon MuiButton-iconSizeSmall">
    <svg viewBox="0 0 24 24" data-testid="DescriptionIcon">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8zm2 16H8v-2h8zm0-4H8v-2h8zm-3-5V3.5L18.5 9z"></path>
    </svg>
  </span>
  ดาวน์โหลด PDF
</button>

<!-- Dialog แสดง PDF Preview -->
<div class="MuiPaper-root MuiDialog-paper MuiDialog-paperWidthLg MuiDialog-paperFullWidth">
  <h2 class="MuiDialogTitle-root">ดูตัวอย่าง PDF</h2>
  <div class="MuiDialogContent-root">
    <iframe 
      title="invoice-pdf" 
      src={pdfUrl}
      style="width: 100%; height: 80vh; border: 0px;"
    ></iframe>
  </div>
  <div class="MuiDialogActions-root">
    <button onClick={() => window.open(pdfUrl, '_blank')}>
      เปิดในแท็บใหม่
    </button>
    <button onClick={() => setShowPdfViewer(false)}>
      ปิด
    </button>
  </div>
</div>
```

## 🎯 Features

### ✅ ที่ทำเสร็จแล้ว

1. **InvoicePdfMasterService** - Service หลักสำหรับสร้าง PDF
2. **CustomerInfoExtractor** - รองรับการดึงข้อมูลลูกค้าจาก Invoice
3. **Template System** - Template สำหรับใบแจ้งหนี้
4. **CSS Styling** - สไตล์ที่เหมาะสมสำหรับภาษาไทย
5. **API Routes** - Routes ครบชุดสำหรับ PDF operations
6. **Controller Methods** - Methods สำหรับจัดการ PDF requests
7. **Fallback System** - กรณี mPDF ไม่พร้อมใช้งาน

### 🔄 Status Management

- **Preview**: สำหรับใบแจ้งหนี้ที่ยังไม่ได้อนุมัติ (มี watermark "PREVIEW")
- **Final**: สำหรับใบแจ้งหนี้ที่อนุมัติแล้ว (ไม่มี watermark)

### 📁 File Structure

```
tnp-backend/
├── app/Services/Accounting/Pdf/
│   ├── InvoicePdfMasterService.php     # Service หลัก
│   └── CustomerInfoExtractor.php       # ดึงข้อมูลลูกค้า (แก้ไขแล้ว)
├── resources/views/accounting/pdf/invoice/
│   ├── invoice-master.blade.php         # Template หลัก
│   ├── invoice-master.css              # CSS หลัก
│   └── partials/
│       ├── invoice-header.blade.php    # Header template
│       ├── invoice-footer.blade.php    # Footer template
│       └── invoice-signature.blade.php # Signature template
├── resources/views/pdf/partials/
│   ├── invoice-header.css              # Header CSS
│   └── invoice-footer.css              # Footer & Signature CSS
└── storage/app/public/pdfs/invoices/   # ไฟล์ PDF ที่สร้าง
```

## ⚙️ Configuration

### PDF Settings (config/pdf.php)

```php
return [
    'mode' => 'utf-8',
    'format' => 'A4', 
    'default_font_size' => 12,
    'default_font' => 'thsarabun',
    'custom_font_dir' => public_path('fonts/thsarabun/'),
    'custom_font_data' => [
        'thsarabun' => [
            'R'  => 'Sarabun-Regular.ttf',
            'B'  => 'Sarabun-Bold.ttf',
            'I'  => 'Sarabun-Italic.ttf',
            'BI' => 'Sarabun-BoldItalic.ttf',
        ],
    ],
    'temp_dir' => storage_path('app/mpdf-temp'),
];
```

## 🔧 Troubleshooting

### ตรวจสอบสถานะระบบ

```bash
# ตรวจสอบผ่าน API
GET /api/v1/system/invoice-pdf-status

# Response ตัวอย่าง:
{
  "success": true,
  "data": {
    "system_ready": true,
    "components": {
      "mpdf": true,
      "thai_fonts": true,
      "temp_dir": true,
      "output_dir": true
    },
    "recommendations": [],
    "preferred_engine": "mPDF"
  }
}
```

### แก้ไขปัญหาที่พบบ่อย

1. **mPDF ไม่ทำงาน**: ติดตั้ง `composer require mpdf/mpdf`
2. **ฟอนต์ไทยไม่แสดง**: ดาวน์โหลดฟอนต์ Sarabun วางไว้ใน `public/fonts/thsarabun/`
3. **ไม่สามารถสร้างไฟล์**: ตรวจสอบสิทธิ์ write ใน `storage/app/` directories
4. **Memory Limit**: เพิ่ม `memory_limit` ใน PHP configuration

## 📱 Frontend Integration

### RTK Query Setup

```javascript
// ใน invoiceApi.js
export const invoiceApi = createApi({
  // ... existing setup
  endpoints: (builder) => ({
    // ... existing endpoints
    generateInvoicePDF: builder.mutation({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}/generate-pdf`,
        method: 'GET',
      }),
    }),
    streamInvoicePDF: builder.query({
      query: (invoiceId) => `/invoices/${invoiceId}/pdf/stream`,
    }),
  }),
});

export const {
  useGenerateInvoicePDFMutation,
  useStreamInvoicePDFQuery,
} = invoiceApi;
```

## 🎨 Customization

### แก้ไข Template

1. **Header**: แก้ไขไฟล์ `invoice-header.blade.php`
2. **Content**: แก้ไขไฟล์ `invoice-master.blade.php`
3. **Footer**: แก้ไขไฟล์ `invoice-footer.blade.php`
4. **Styling**: แก้ไขไฟล์ CSS ตาม structure ด้านบน

### เพิ่มฟิลด์ใหม่

1. แก้ไข `buildFinancialSummary()` ใน `InvoicePdfMasterService`
2. แก้ไข template files ให้แสดงฟิลด์ใหม่
3. เพิ่ม CSS styling ตามความต้องการ

---

## 🚨 หมายเหตุสำคัญ

- ระบบรองรับ **Preview mode** สำหรับใบแจ้งหนี้ที่ยังไม่อนุมัติ
- ใช้ **mPDF** เป็นหลัก พร้อม fallback mechanism
- รองรับ **ภาษาไทย** ด้วยฟอนต์ Sarabun
- **File paths** ต้องใช้ absolute paths สำหรับ mPDF
- **Watermark** จะแสดงเฉพาะใน Preview mode เท่านั้น
