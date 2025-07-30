เพื่อให้การพัฒนา Frontend ด้วย Material UI (MUI) สอดคล้องกับ Backend และแนวทางในเอกสาร doce.md, DATABASE\_SCHEMA\_ALIGNMENT.md, README.md

---

### 1. `src/features/Accounting`

**แก้หรือสร้าง service สำหรับแต่ละ resource (tnp-frontend\src\features):**

- `quotationService.js`
- `invoiceService.js`
- `receiptService.js`
- `deliveryNoteService.js`
- `customerService.js`
- `productService.js`

**แต่ละ service ใช้ config จาก** `src/api/axios.js` หรือ `src/api/apiConfig.js`

> อิงจาก backend service เช่น `QuotationService.php`, `InvoiceService.php`, `ReceiptService.php` ที่มีอยู่แล้ว โดย mapping ตาม endpoint ใน README.md

**ตัวอย่าง: **``

```js
import axios from '@/api/axios';

export const fetchQuotations = (params) => axios.get('/api/v1/quotations', { params });
export const getQuotation = (id) => axios.get(`/api/v1/quotations/${id}`);
export const createQuotation = (data) => axios.post('/api/v1/quotations', data);
export const updateQuotation = (id, data) => axios.put(`/api/v1/quotations/${id}`, data);
export const changeQuotationStatus = (id, status, notes) =>
  axios.patch(`/api/v1/quotations/${id}/status`, { status, notes });
export const downloadQuotationPDF = (id) => axios.get(`/api/v1/quotations/${id}/pdf`, { responseType: 'blob' });
```

---

### 2. `src/pages/Accounting` & `src/pages/Accounting/components`

**สร้าง/ปรับหน้า Listing และ Form สำหรับเอกสารแต่ละประเภท:**

- `QuotationListPage` / `QuotationFormPage`
- `InvoiceListPage` / `InvoiceFormPage`
- `ReceiptListPage` / `ReceiptFormPage`
- `DeliveryNoteListPage` / `DeliveryNoteFormPage`

**ใช้ MUI Component เป็นหลัก** เช่น Grid, Box, Card, Tabs, Autocomplete, Dialog, Snackbar, Stepper

**Logic ที่ควรมีในแต่ละหน้า:**

- React Query (`useQuery`, `useMutation`)
- Zustand (จัดเก็บ UI state เช่น tab, filter)
- Pagination + Filtering
- Responsive layout (Mobile-first)
- Modal Upload, Toast แจ้งผล
- Inline Validation (`react-hook-form` + `@hookform/resolvers/yup`)

---

### 3. `src/App.jsx`

**เพิ่ม route ใหม่ภายใต้เส้นทางหลัก **``

```jsx
<Route path="/accounting" element={<AccountingLayout />}>
  <Route path="quotations" element={<QuotationListPage />} />
  <Route path="quotations/:id" element={<QuotationFormPage />} />
  <Route path="invoices" element={<InvoiceListPage />} />
  <Route path="receipts" element={<ReceiptListPage />} />
  <Route path="delivery-notes" element={<DeliveryNoteListPage />} />
</Route>
```

---

### 4. `src/pages/ControlPanel`

**เพิ่ม icon ทางลัดใหม่ไปยังแต่ละเอกสาร:**

```js
{
  label: 'Quotation',
  path: '/accounting/quotations',
  icon: <InsertDriveFileIcon />,
},
{
  label: 'Invoice',
  path: '/accounting/invoices',
  icon: <ReceiptIcon />,
},
...
```

---

## ✅ UX/UI Design (ตาม `doce.md`, `flowaccount.md`)

### ✅ Layout & Navigation

- Side Nav แยกหมวดเอกสาร + badge จำนวน
- Top Tabs สำหรับกรองสถานะ (รอตรวจ, อนุมัติ, ปฏิเสธ)
- Responsive: Hamburger Menu บนจอเล็ก

### ✅ Listing Page

- ใช้ MUI `Card`, `Stack`, `Chip` แสดงรายการ
- Filter โดยใช้ `DatePicker`, `Autocomplete`, `Select`, `Input`

### ✅ Form Page (Step-by-Step)

- ใช้ MUI `Stepper`
- Section:
  - ลูกค้า (Autocomplete)
  - รายการสินค้า (Dynamic Row + VAT)
  - คำนวณยอด (Deposit, Tax)
  - Upload & Confirm

### ✅ Modal/Popup

- Drag & Drop ด้วย `Dropzone` หรือ `useDropzone`
- Preview ไฟล์ + ยืนยันก่อนส่ง

### ✅ Role-based UI

- ใช้ JWT Role ตรวจสอบสิทธิ์
- สร้าง Hook `useUserRole()` แยก Logic

### ✅ PDF/Email/Print

- ปุ่ม "Preview PDF" → `/api/v1/{doc}/{id}/pdf` เปิด modal/pdf viewer
- ปุ่ม "ส่งอีเมล" → `POST /api/v1/email/send-pdf`

---

## ✅ เชื่อมโยงฐานข้อมูล (ตาม `DATABASE_SCHEMA_ALIGNMENT.md`)

### Customer Model: `master_customers`

- `cus_id`, `cus_no`, `cus_firstname`, `cus_company`, ...

### Product Model: `master_product_categories`

- `mpc_id`, `mpc_name`, `mpc_remark`, ...

> ใช้ accessor/mapper ใน Laravel resource เพื่อส่งข้อมูล frontend แบบ friendly และสอดคล้องกับ schema จริง

---

หากต้องการ scaffold ตัวอย่างหน้า `QuotationListPage.jsx` หรือ `quotationApi.js` เพิ่มเติม แจ้งได้เลย

