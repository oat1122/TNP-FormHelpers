# 🚀 Next Steps Development Guide

## 📋 แผนการพัฒนาต่อ (Step by Step)

### **Phase 1: Quotation Management System**

#### 1.1 สร้างหน้า Quotation List

```
ไฟล์: src/pages/Accounting/QuotationList.jsx
- แสดงรายการใบเสนอราคาทั้งหมด
- ระบบค้นหาและกรอง (วันที่, ลูกค้า, สถานะ)
- Bulk actions (approve, delete)
- Export to PDF/Excel
```

#### 1.2 สร้างหน้า Quotation Form

```
ไฟล์: src/pages/Accounting/QuotationForm.jsx
- Create/Edit/View modes
- Auto-fill จาก Pricing Request
- Line items management
- VAT calculation
- Terms & conditions
```

#### 1.3 สร้าง Quotation Components

```
ไฟล์ต่างๆ:
- QuotationCard.jsx (สำหรับแสดงใน list)
- QuotationModal.jsx (สำหรับ quick view)
- QuotationLineItem.jsx (สำหรับรายการสินค้า)
- QuotationPDFPreview.jsx (สำหรับ preview PDF)
```

### **Phase 2: Invoice Management System**

#### 2.1 สร้างหน้า Invoice List

```
ไฟล์: src/pages/Accounting/InvoiceList.jsx
- แสดงรายการใบแจ้งหนี้
- Payment status tracking
- Overdue alerts
- Payment history
```

#### 2.2 สร้างหน้า Invoice Form

```
ไฟล์: src/pages/Accounting/InvoiceForm.jsx
- Create from quotation
- Payment terms
- Tax invoice options
- Due date management
```

### **Phase 3: Receipt Management System**

#### 3.1 สร้างหน้า Receipt List

```
ไฟล์: src/pages/Accounting/ReceiptList.jsx
- Payment tracking
- Evidence upload
- VAT reports
- Bank reconciliation
```

#### 3.2 สร้าง Payment Components

```
ไฟล์ต่างๆ:
- PaymentForm.jsx
- PaymentEvidenceUpload.jsx
- VATCalculator.jsx
- ReceiptPrintPreview.jsx
```

### **Phase 4: Delivery Management System**

#### 4.1 สร้างหน้า Delivery Notes

```
ไฟล์: src/pages/Accounting/DeliveryList.jsx
- Shipping status tracking
- Courier integration
- Delivery timeline
- POD (Proof of Delivery)
```

#### 4.2 สร้าง Delivery Components

```
ไฟล์ต่างๆ:
- DeliveryTracker.jsx
- CourierSelector.jsx
- DeliveryTimeline.jsx
- ShippingLabel.jsx
```

---

## 🎨 Design System Guidelines

### **Colors Usage**

```css
/* Primary Actions */
.btn-primary {
  background: #900f0f;
}
.btn-approve {
  background: #900f0f;
}

/* Secondary Actions */
.btn-secondary {
  background: #b20000;
}
.btn-edit {
  border: 1px solid #b20000;
}

/* Light Backgrounds */
.notification-bg {
  background: #e36264;
}
.hover-effect:hover {
  background: #e36264;
}

/* Neutral */
.card-bg {
  background: #ffffff;
}
.text-on-red {
  color: #ffffff;
}
```

### **Component Patterns**

```jsx
// Standard Card Layout
<Card sx={{ borderRadius: 3, border: "1px solid #E0E0E0" }}>
  <CardContent>
    <Typography variant="h6" color="primary">
      Title
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Content
    </Typography>
  </CardContent>
  <CardActions>
    <Button color="primary">Primary Action</Button>
    <Button color="secondary">Secondary Action</Button>
  </CardActions>
</Card>
```

---

## 🔧 Technical Implementation

### **API Integration Pattern**

```javascript
// 1. Add to accountingApi.js
export const quotationApi = accountingApi.injectEndpoints({
  endpoints: (builder) => ({
    getQuotations: builder.query({
      query: (params) => ({ url: "/quotations", params }),
      providesTags: ["Quotation"],
    }),
    createQuotation: builder.mutation({
      query: (data) => ({ url: "/quotations", method: "POST", body: data }),
      invalidatesTags: ["Quotation"],
    }),
  }),
});

// 2. Export hooks
export const { useGetQuotationsQuery, useCreateQuotationMutation } =
  quotationApi;
```

### **State Management Pattern**

```javascript
// Add to accountingSlice.js
const quotationState = {
  selectedQuotation: null,
  quotationFilters: {
    status: "all",
    dateRange: null,
    customer: null,
  },
  quotationModal: {
    open: false,
    mode: "view", // 'create', 'edit', 'view'
  },
};
```

### **Component Structure Pattern**

```
src/pages/Accounting/
├── components/
│   ├── common/
│   │   ├── StatusChip.jsx
│   │   ├── DateRangePicker.jsx
│   │   └── CustomerSelector.jsx
│   ├── quotation/
│   │   ├── QuotationCard.jsx
│   │   ├── QuotationForm.jsx
│   │   └── QuotationLineItems.jsx
│   ├── invoice/
│   ├── receipt/
│   └── delivery/
├── pages/
│   ├── QuotationList.jsx
│   ├── InvoiceList.jsx
│   ├── ReceiptList.jsx
│   └── DeliveryList.jsx
└── hooks/
    ├── useQuotations.js
    ├── useInvoices.js
    └── useReceipts.js
```

---

## 📝 Development Checklist

### **For each new page:**

- [ ] Create page component with proper routing
- [ ] Add to navigation menu
- [ ] Implement responsive design
- [ ] Add loading states and error handling
- [ ] Add search and filter functionality
- [ ] Implement CRUD operations
- [ ] Add bulk actions where appropriate
- [ ] Create corresponding API endpoints
- [ ] Add proper state management
- [ ] Write documentation

### **Testing Checklist:**

- [ ] Test responsive design on mobile/tablet
- [ ] Test all CRUD operations
- [ ] Test search and filter functionality
- [ ] Test error states and edge cases
- [ ] Test loading states
- [ ] Test navigation flow
- [ ] Test print/PDF functionality
- [ ] Performance testing

---

## 🎯 Priority Order

1. **HIGH PRIORITY**: Quotation Management (เป็น core workflow)
2. **MEDIUM PRIORITY**: Invoice Management (ต่อจาก quotation)
3. **MEDIUM PRIORITY**: Receipt Management (payment tracking)
4. **LOW PRIORITY**: Delivery Management (final step)

---

## 🚀 Quick Start Commands

```bash
# สร้าง component ใหม่
touch src/pages/Accounting/QuotationList.jsx

# เพิ่ม route ใน App.jsx
<Route path="quotations" element={<QuotationList />} />

# เพิ่ม navigation item ใน AccountingLayout.jsx
{
  id: 'quotation',
  title: 'ใบเสนอราคา',
  icon: AssignmentIcon,
  path: '/accounting/quotations',
}
```

**พร้อมเริ่มพัฒนาต่อแล้ว!** 🚀
