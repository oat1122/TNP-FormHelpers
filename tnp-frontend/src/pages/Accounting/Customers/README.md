# หน้าจัดการลูกค้า (Customer Management) สำหรับระบบบัญชี

## 📁 ไฟล์ที่ได้สร้างขึ้น

### 1. หน้าหลักของลูกค้า
- **ไฟล์**: `src/pages/Accounting/Customers/index.jsx`
- **เส้นทาง**: `http://localhost:5173/accounting/customers`
- **คุณสมบัติ**:
  - แสดงรายการลูกค้าทั้งหมดในรูปแบบ cards
  - ค้นหาลูกค้าตามชื่อ, ผู้ติดต่อ, หรืออีเมล
  - แบ่งตามประเภท: ทั้งหมด, มีการขอราคาที่ได้ราคาแล้ว, ลูกค้าประจำ
  - แสดงข้อมูลติดต่อ, สถิติการทำธุรกิจ
  - ปุ่มสร้างใบเสนอราคาจากการขอราคาที่มีสถานะ "ได้ราคาแล้ว"

### 2. หน้ารายละเอียดลูกค้า
- **ไฟล์**: `src/pages/Accounting/Customers/CustomerDetail.jsx`
- **เส้นทาง**: `http://localhost:5173/accounting/customers/:id`
- **คุณสมบัติ**:
  - แสดงข้อมูลลูกค้าโดยละเอียด
  - แสดงสถิติการทำธุรกิจ
  - แสดงประวัติใบเสนอราคา, ใบแจ้งหนี้, การขอราคา
  - สามารถสร้างใบเสนอราคาจากการขอราคาที่ได้ราคาแล้ว

### 3. Dialog สำหรับสร้างใบเสนอราคาจากการขอราคา
- **ไฟล์**: `src/pages/Accounting/Customers/QuotationFromPricingDialog.jsx`
- **คุณสมบัติ**:
  - แสดงรายการขอราคาที่มีสถานะ "ได้ราคาแล้ว"
  - เลือกรายการที่ต้องการสร้างใบเสนอราคา
  - คำนวณยอดรวมและ VAT อัตโนมัติ
  - ส่งต่อข้อมูลไปยังหน้าสร้างใบเสนอราคา

### 4. Customer Service
- **ไฟล์**: `src/services/customerService.js`
- **คุณสมบัติ**:
  - จัดการ API calls สำหรับลูกค้า
  - Constants สำหรับสถานะการขอราคา
  - ฟังก์ชันแปลงข้อมูลการขอราคาเป็นรายการใบเสนอราคา
  - ฟังก์ชันจัดรูปแบบข้อมูลต่างๆ

## 🎯 สถานะการขอราคาที่รองรับ

จากโค้ดใน `PricingForm.jsx` ที่คุณแนบมา:

```javascript
// สถานะที่แสดงปุ่ม "บันทึก" กรณีเป็นผู้จัดการหรือฝ่ายผลิต
const submitBtnRenderByManager = isManagerOrProduction && [
  "20db8b15-092b-11f0-b223-38ca84abdf0a",    // รอทำราคา
  "20db8be1-092b-11f0-b223-38ca84abdf0a",   // ได้ราคาแล้ว ⭐
  "20db8c29-092b-11f0-b223-38ca84abdf0a",    // แก้ไขรอทำราคา
  "20db8cbf-092b-11f0-b223-38ca84abdf0a",    // ปฏิเสธงาน
  "20db8cf1-092b-11f0-b223-38ca84abdf0a",    // ทำราคาไม่ได้
].includes(pr_status_id);

// สถานะที่แสดงปุ่ม "บันทึกและส่งคำขอ" กรณีเป็นเซล
const submitReqBtnRenderBySale = isSale && [
  "20db7a92-092b-11f0-b223-38ca84abdf0a",   // รอส่งคำขอ
  "20db8be1-092b-11f0-b223-38ca84abdf0a",   // ได้ราคาแล้ว ⭐
  "20db8cbf-092b-11f0-b223-38ca84abdf0a",   // ปฏิเสธงาน
  "20db8cf1-092b-11f0-b223-38ca84abdf0a",   // ทำราคาไม่ได้
].includes(pr_status_id);
```

**หน้าลูกค้าจะแสดงการขอราคาที่มีสถานะ "ได้ราคาแล้ว" (`20db8be1-092b-11f0-b223-38ca84abdf0a`) เท่านั้น**

## 🔧 การติดตั้งและใช้งาน

### 1. เพิ่ม Routes ใน App.jsx
```javascript
const CustomersPage = lazy(() => import("./pages/Accounting/Customers/index"));
const CustomerDetailPage = lazy(() => import("./pages/Accounting/Customers/CustomerDetail"));

// ใน routing section
<Route path="customers" element={<CustomersPage />} />
<Route path="customers/:id" element={<CustomerDetailPage />} />
<Route path="customers/create" element={<div>Customer Create Page (ยังไม่ได้สร้าง)</div>} />
<Route path="customers/:id/edit" element={<div>Customer Edit Page (ยังไม่ได้สร้าง)</div>} />
```

### 2. อัพเดท Breadcrumbs ใน AccountingLayout.jsx
```javascript
// อัพเดทฟังก์ชัน getBreadcrumbs เพื่อรองรับ customers
else if (paths.includes('customers')) {
  breadcrumbs.push({ label: 'ลูกค้า', path: '/accounting/customers' });
  if (paths.includes('new') || paths.includes('create')) {
    breadcrumbs.push({ label: 'เพิ่มลูกค้าใหม่', path: null });
  } else if (paths.length > 3 && !paths.includes('edit')) {
    breadcrumbs.push({ label: 'รายละเอียดลูกค้า', path: null });
  } else if (paths.includes('edit')) {
    breadcrumbs.push({ label: 'แก้ไขข้อมูล', path: null });
  }
}
```

### 3. แก้ไข Import Icons ให้ถูกต้อง
เปลี่ยนจาก `@mui/material/icons` เป็น `@mui/icons-material` ในไฟล์:
- `AccountingLayout.jsx`
- `DocumentStatusBadge.jsx`
- `AccountingDashboard.jsx`

## 📱 คุณสมบัติหลัก

### 1. หน้าจัดการลูกค้า (`/accounting/customers`)
- ✅ แสดงรายการลูกค้าทั้งหมด
- ✅ ค้นหาลูกค้า
- ✅ กรองตาม tabs (ทั้งหมด, มีการขอราคาที่ได้ราคาแล้ว, ลูกค้าประจำ)
- ✅ แสดงข้อมูลพื้นฐานและสถิติ
- ✅ ปุ่มสร้างใบเสนอราคาสำหรับลูกค้าที่มีการขอราคาที่ได้ราคาแล้ว
- ✅ Responsive design (รองรับมือถือ)

### 2. การสร้างใบเสนอราคาจากการขอราคา
- ✅ เลือกการขอราคาที่มีสถานะ "ได้ราคาแล้ว"
- ✅ เลือกหลายรายการได้
- ✅ แสดงสรุปยอดรวมและ VAT
- ✅ เพิ่มหมายเหตุเพิ่มเติม
- ✅ แปลงข้อมูลการขอราคาเป็นรายการใบเสนอราคา
- ✅ ส่งต่อไปยังหน้าสร้างใบเสนอราคา

### 3. Mobile-friendly
- ✅ Responsive design
- ✅ Floating Action Button สำหรับมือถือ
- ✅ Scrollable tabs
- ✅ Touch-friendly interface

## 🚀 ขั้นตอนถัดไป

1. **สร้างหน้าเพิ่ม/แก้ไขลูกค้า**
2. **เชื่อมต่อกับ Backend API จริง**
3. **เพิ่มการจัดการสิทธิ์ตาม Role**
4. **เพิ่ม Real-time updates**
5. **เพิ่มการ Export ข้อมูล**

## 🎨 Design ตาม FlowAccount

การออกแบบใช้หลักการของ FlowAccount:
- **Clean & Professional**: ดีไซน์สะอาด เหมาะกับธุรกิจ
- **One-Click Conversion**: แปลงเอกสารด้วยคลิกเดียว
- **Status-Driven UI**: แสดงสถานะชัดเจนทุกขั้นตอน
- **Mobile Responsive**: ใช้งานได้ทุกอุปกรณ์

หน้าลูกค้าพร้อมใช้งานแล้ว! 🎉
