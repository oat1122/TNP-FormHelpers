# Step 0: นำเข้างานจากระบบ Pricing

## 🎯 วัตถุประสงค์
สร้างหน้าดึงงานจากระบบ Pricing ที่แสดงงานที่สถานะ "Complete" และให้ Sales สามารถเลือกงานเพื่อสร้างใบเสนอราคาได้

## 🔄 Flow การทำงาน
```
ระบบ Pricing (สถานะ Complete) → หน้างานใหม่ → เลือกงาน → สร้างใบเสนอราคา
```

## 🎨 UI Design

### หน้าดึงงานจาก Pricing
```
Pricing System Integration:
┌─────────────────────────────────────────────────────────────┐
│ 📊 งานใหม่จากระบบ Pricing                                   │
│                                                             │
│ Filter: [🔍 ค้นหา] [📅 วันที่] [👤 ลูกค้า] [🔄 รีเฟรช]      │
│                                                             │
│ ┌─ Pricing Request ที่พร้อมออกใบเสนอราคา ────────────────┐  │
│ │ ✅ PR-2025-001  บริษัท ABC จำกัด                    │  │
│ │    งานพิมพ์โบรชัวร์ A4 4 สี (จำนวน: 2 ชิ้น)         │  │
│ │    ผ้า: Premium Paper | สี: 4 สี | ขนาด: A4         │  │
│ │    สถานะ: Complete | วันที่เสร็จ: 15 ม.ค. 2568        │  │
│ │    [📋 สร้างใบเสนอราคา] [👁️ ดูรายละเอียด]            │  │
│ │                                                     │  │
│ │ ✅ PR-2025-002  ร้าน XYZ                           │  │
│ │    เสื้อโปโล (จำนวน: 50 ตัว)                        │  │
│ │    ผ้า: Cotton 100% | สี: Navy Blue | ขนาด: S-XL   │  │
│ │    สถานะ: Complete | วันที่เสร็จ: 14 ม.ค. 2568        │  │
│ │    [📋 สร้างใบเสนอราคา] [👁️ ดูรายละเอียด]            │  │
│ └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Implementation

### API Integration
```javascript
// Hook สำหรับดึงงานจาก Pricing Request (ตาม technical-implementation.md)
const usePricingRequests = () => {
  return useQuery({
    queryKey: ['pricing-requests'],
    queryFn: () => pricingApi.getCompletedRequests(),
    refetchInterval: 30000, // Check ทุก 30 วินาที
  });
};

// Function Auto-fill จาก Pricing Request ตาม DTO structure
const createQuotationFromPricing = async (pricingRequestId) => {
  const autofillData = await pricingApi.getAutofillData(pricingRequestId);
  
  const quotationData = {
    // Auto-fill จาก PricingRequestAutofillDTO
    pricing_request_id: autofillData.pr_id,
    work_name: autofillData.pr_work_name,
    pattern: autofillData.pr_pattern,
    fabric_type: autofillData.pr_fabric_type,
    color: autofillData.pr_color,
    sizes: autofillData.pr_sizes,
    quantity: autofillData.pr_quantity,
    due_date: autofillData.pr_due_date,
    
    // Auto-fill ข้อมูลลูกค้าจาก CustomerAutofillDTO
    customer_id: autofillData.customer.cus_id,
    customer_company: autofillData.customer.cus_company,
    customer_tax_id: autofillData.customer.cus_tax_id,
    customer_address: autofillData.customer.cus_address,
    customer_zip_code: autofillData.customer.cus_zip_code,
    customer_tel_1: autofillData.customer.cus_tel_1,
    customer_email: autofillData.customer.cus_email,
    
    // ข้อมูลเพิ่มเติม
    initial_notes: autofillData.notes?.map(note => 
      `[${note.note_type_label}] ${note.prn_text}`
    ).join('\n') || '',
    
    status: 'draft',
    created_by: getCurrentUser().id
  };
  
  return quotationApi.create(quotationData);
};
```

### Components ที่ต้องสร้าง
```javascript
// PricingRequestsList.jsx - แสดงรายการ Pricing Request
// CreateQuotationModal.jsx - Modal สร้างใบเสนอราคา
// PricingRequestCard.jsx - Card แสดงรายละเอียด Pricing Request
// PricingRequestFilters.jsx - ตัวกรองค้นหา
// PricingRequestSelector.jsx - Component เลือก Pricing Request สำหรับ Auto-fill
```

## 📋 Required APIs

### GET /api/pricing/completed-requests
**Response:**
```json
{
  "data": [
    {
      "pr_id": 1001,
      "pr_work_name": "งานพิมพ์โบรชัวร์ A4 4 สี",
      "pr_cus_id": 123,
      "pr_pattern": "A4 Brochure",
      "pr_fabric_type": "Premium Paper",
      "pr_color": "4 สี",
      "pr_sizes": "A4",
      "pr_quantity": 2,
      "pr_due_date": "2025-01-30",
      "pr_status": "complete",
      "pr_completed_at": "2025-01-15T00:00:00Z",
      "customer": {
        "cus_id": 123,
        "cus_company": "บริษัท ABC จำกัด",
        "cus_tax_id": "0123456789012",
        "cus_address": "123 ถนนสุขุมวิท",
        "cus_zip_code": "10110",
        "cus_tel_1": "02-123-4567",
        "cus_email": "contact@abc-company.com"
      }
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

### GET /api/quotations/autofill/pricing-request/:id
**Response:**
```json
{
  "pr_id": 1001,
  "pr_work_name": "งานพิมพ์โบรชัวร์ A4 4 สี",
  "pr_pattern": "A4 Brochure",
  "pr_fabric_type": "Premium Paper",
  "pr_color": "4 สี",
  "pr_sizes": "A4",
  "pr_quantity": 2,
  "pr_due_date": "2025-01-30",
  "customer": {
    "cus_id": 123,
    "cus_company": "บริษัท ABC จำกัด",
    "cus_tax_id": "0123456789012",
    "cus_address": "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ",
    "cus_zip_code": "10110",
    "cus_tel_1": "02-123-4567",
    "cus_email": "contact@abc-company.com",
    "cus_firstname": "สมชาย",
    "cus_lastname": "ใจดี"
  },
  "notes": [
    {
      "prn_id": 1,
      "prn_text": "ลูกค้าต้องการคุณภาพพิเศษ",
      "prn_note_type": 1,
      "note_type_label": "Sale Note"
    }
  ]
}
```

### POST /api/quotations/create-from-pricing
**Request:**
```json
{
  "pricing_request_id": 1001,
  "payment_terms": "credit_30_days",
  "deposit_percentage": 50,
  "notes": "ราคานี้รวมค่าจัดส่งและติดตั้งแล้ว"
}
```

## 🔐 Permissions
- **Sales**: สร้างใบเสนอราคาได้
- **Account**: เข้าถึงและสร้างได้ทั้งหมด

## ✅ Acceptance Criteria
1. แสดงเฉพาะ Pricing Request ที่สถานะ "Complete"
2. มีระบบ filter ตามวันที่และลูกค้า
3. สามารถสร้างใบเสนอราคาจาก Pricing Request ได้
4. Auto-fill ข้อมูลลูกค้าและรายละเอียดงานอัตโนมัติ
5. ระบบรีเฟรชข้อมูลทุก 30 วินาทีเพื่อดู Pricing Request ใหม่
6. รองรับการ Auto-fill Notes จาก Pricing Request
7. แสดงข้อมูลสินค้า/บริการตาม Pricing Request structure

## 🚀 AI Command
```bash
สร้างหน้าดึง Pricing Request จากระบบ Pricing ที่แสดง Pricing Request ที่สถานะ "Complete" 
และให้ Sales สามารถเลือกงานเพื่อสร้างใบเสนอราคาด้วย Auto-fill ข้อมูลตาม technical-implementation.md
```
