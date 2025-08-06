# PricingIntegration Components

คู่มือการใช้งาน components สำหรับหน้า PricingIntegration ที่ถูกแยกออกมาเพื่อการบำรุงรักษาที่ง่ายขึ้น

## 📁 โครงสร้างไฟล์

```
components/
├── index.js                      # Export ทุก components
├── PricingRequestCard.jsx        # แสดงข้อมูล Pricing Request แต่ละรายการ
├── CreateQuotationModal.jsx      # Modal สำหรับสร้างใบเสนอราคา
├── FilterSection.jsx             # ส่วนกรองข้อมูล
├── PaginationSection.jsx         # ส่วนแสดงและจัดการ pagination
├── LoadingState.jsx              # แสดง skeleton loading
├── ErrorState.jsx                # แสดงข้อผิดพลาด
├── EmptyState.jsx                # แสดงเมื่อไม่มีข้อมูล
├── Header.jsx                    # ส่วนหัวของหน้า
├── FloatingActionButton.jsx      # ปุ่ม refresh แบบลอย
└── README.md                     # คู่มือนี้
```

## 🚀 วิธีการใช้งาน

### 1. Import Components

```jsx
import {
    PricingRequestCard,
    CreateQuotationModal,
    FilterSection,
    PaginationSection,
    LoadingState,
    ErrorState,
    EmptyState,
    Header,
    FloatingActionButton,
} from './components';
```

### 2. หรือ Import แต่ละไฟล์

```jsx
import PricingRequestCard from './components/PricingRequestCard';
import CreateQuotationModal from './components/CreateQuotationModal';
```

## 📋 รายละเอียด Components

### PricingRequestCard
แสดงข้อมูล Pricing Request ในรูปแบบ Card

**Props:**
- `request` (object) - ข้อมูล pricing request
- `onCreateQuotation` (function) - callback เมื่อกดสร้างใบเสนอราคา
- `onViewDetails` (function) - callback เมื่อกดดูรายละเอียด

### CreateQuotationModal
Modal สำหรับสร้างใบเสนอราคาจาก pricing requests หลายรายการ

**Props:**
- `open` (boolean) - เปิด/ปิด modal
- `onClose` (function) - callback เมื่อปิด modal
- `pricingRequest` (object) - ข้อมูล pricing request ที่เลือก
- `onSubmit` (function) - callback เมื่อส่งข้อมูล

### FilterSection
ส่วนกรองข้อมูลด้วยการค้นหาและช่วงวันที่

**Props:**
- `searchQuery` (string) - คำค้นหา
- `onSearchChange` (function) - callback เมื่อเปลี่ยนคำค้นหา
- `dateRange` (object) - ช่วงวันที่ { start, end }
- `onDateRangeChange` (function) - callback เมื่อเปลี่ยนช่วงวันที่
- `onRefresh` (function) - callback เมื่อกด refresh
- `onResetFilters` (function) - callback เมื่อล้างตัวกรอง

### PaginationSection
จัดการการแสดงและการใช้งาน pagination

**Props:**
- `pagination` (object) - ข้อมูล pagination จาก API
- `currentPage` (number) - หน้าปัจจุบัน
- `itemsPerPage` (number) - จำนวนรายการต่อหน้า
- `isFetching` (boolean) - สถานะการโหลดข้อมูล
- `onPageChange` (function) - callback เมื่อเปลี่ยนหน้า
- `onItemsPerPageChange` (function) - callback เมื่อเปลี่ยนจำนวนรายการต่อหน้า
- `showHeader` (boolean) - แสดงส่วนหัวหรือไม่ (default: true)

### LoadingState
แสดง skeleton loading

**Props:**
- `itemCount` (number) - จำนวน skeleton ที่จะแสดง (default: 6)

### ErrorState
แสดงข้อความเมื่อเกิดข้อผิดพลาด

**Props:**
- `error` (object) - ข้อมูล error
- `onRetry` (function) - callback เมื่อกดลองใหม่

### EmptyState
แสดงข้อความเมื่อไม่มีข้อมูล

**Props:**
- `onRefresh` (function) - callback เมื่อกด refresh

### Header
ส่วนหัวของหน้า

**Props:** ไม่มี (static content)

### FloatingActionButton
ปุ่ม refresh แบบลอยที่มุมล่างขวา

**Props:**
- `onRefresh` (function) - callback เมื่อกด refresh

## 🔧 การปรับแต่ง

### เพิ่ม Component ใหม่
1. สร้างไฟล์ component ใหม่ในโฟลเดอร์ `components/`
2. เพิ่มการ export ในไฟล์ `index.js`
3. Import และใช้งานใน `PricingIntegration.jsx`

### แก้ไข Styling
ใช้ Material-UI sx prop หรือ styled components ตามต้องการ

## 🎯 ประโยชน์ของการแยก Components

1. **อ่านง่าย** - แต่ละ component มีหน้าที่เฉพาะ
2. **บำรุงรักษาง่าย** - แก้ไขได้ทีละส่วน
3. **นำกลับมาใช้ได้** - components สามารถใช้ในหน้าอื่นได้
4. **ทดสอบง่าย** - ทดสอบได้ทีละ component
5. **ทำงานเป็นทีม** - หลายคนแก้ไขไฟล์ต่างกันได้

## 🚨 หมายเหตุ

- ใช้ Material-UI เป็น UI framework หลัก
- ใช้ Redux Toolkit สำหรับ state management
- ใช้ RTK Query สำหรับ API calls
- ใช้ date-fns สำหรับการจัดการวันที่
