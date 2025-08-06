# PricingIntegration Components

คู่มือการใช้งาน components สำหรับหน้า PricingIntegration ที่ถูกแยกออกมาเพื่อการบำรุงรักษาที่ง่ายขึ้น

## 📁 โครงสร้างไฟล์

```
components/
├── index.js                      # Export ทุก components
├── PricingRequestCard.jsx        # แสดงข้อมูล Pricing Request แต่ละรายการ
├── CreateQuotationModal.jsx      # Modal สำหรับเลือกงานสร้างใบเสนอราคา
├── CreateQuotationForm.jsx       # ฟอร์มสร้างใบเสนอราคา (หน้าเต็ม)
├── QuotationPreview.jsx          # แสดงตัวอย่างใบเสนอราคา
├── FilterSection.jsx             # ส่วนกรองข้อมูล
├── PaginationSection.jsx         # ส่วนแสดงและจัดการ pagination
├── LoadingState.jsx              # แสดง skeleton loading
├── ErrorState.jsx                # แสดงข้อผิดพลาด
├── EmptyState.jsx                # แสดงเมื่อไม่มีข้อมูล
├── Header.jsx                    # ส่วนหัวของหน้า
├── FloatingActionButton.jsx      # ปุ่ม refresh แบบลอย
├── styles.css                    # CSS สำหรับ print และ animations
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
Modal สำหรับเลือกงานที่จะสร้างใบเสนอราคา (ขั้นตอนแรก)

**Props:**
- `open` (boolean) - เปิด/ปิด modal
- `onClose` (function) - callback เมื่อปิด modal
- `pricingRequest` (object) - ข้อมูล pricing request ที่เลือก
- `onSubmit` (function) - callback เมื่อเลือกงานเสร็จ

### CreateQuotationForm
ฟอร์มสร้างใบเสนอราคาแบบเต็มหน้า พร้อม stepper และ preview

**Props:**
- `selectedPricingRequests` (array) - array ของ pricing requests ที่เลือก
- `onBack` (function) - callback เมื่อกดย้อนกลับ
- `onSave` (function) - callback เมื่อบันทึกร่าง
- `onSubmit` (function) - callback เมื่อส่งตรวจสอบ

**Features:**
- 3-step form: ข้อมูลงาน, คำนวณราคา, เงื่อนไขการชำระ
- Real-time calculation
- Preview modal
- Print functionality
- Responsive design

### QuotationPreview
แสดงตัวอย่างใบเสนอราคาในรูปแบบที่พร้อมพิมพ์

**Props:**
- `formData` (object) - ข้อมูลฟอร์ม
- `quotationNumber` (string) - หมายเลขใบเสนอราคา

**Features:**
- A4 layout optimized
- Print-friendly styling
- Professional design
- Company branding

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

## 🐛 การแก้ไขปัญหาที่พบ

### Import Error สำหรับ Icons
**ปัญหา:** `Calendar` icon ไม่มีใน @mui/icons-material
```javascript
// ❌ ผิด
import { Calendar as CalendarIcon } from '@mui/icons-material';

// ✅ ถูกต้อง  
import { CalendarToday as CalendarIcon } from '@mui/icons-material';
```

### CSS Import ใน Component
**ปัญหา:** การ import CSS ใน component อาจทำให้เกิด error ในบาง setup
```javascript
// ❌ อาจมีปัญหา
import './styles.css';

// ✅ ทางเลือก - ใช้ styled components แทน
const StyledComponent = styled(Box)(({ theme }) => ({
  // styles here
}));
```

## 🧪 การทดสอบ

### ทดสอบ Component
สามารถใช้ `ComponentTest.jsx` เพื่อทดสอบว่าระบบทำงานได้ปกติ

```jsx
import ComponentTest from './components/ComponentTest';

// ใส่ในหน้าเพื่อทดสอบ
<ComponentTest />
```

### ตรวจสอบ Console Error
1. เปิด Developer Tools
2. ตรวจสอบ Console tab
3. หากมี import error ให้ตรวจสอบชื่อ icon ใน Material-UI documentation

## 🎯 ประโยชน์ของการแยก Components

1. **อ่านง่าย** - แต่ละ component มีหน้าที่เฉพาะ
2. **บำรุงรักษาง่าย** - แก้ไขได้ทีละส่วน
3. **นำกลับมาใช้ได้** - components สามารถใช้ในหน้าอื่นได้
4. **ทดสอบง่าย** - ทดสอบได้ทีละ component
5. **ทำงานเป็นทีม** - หลายคนแก้ไขไฟล์ต่างกันได้

## 🎨 Theme Colors ที่ใช้

ระบบใช้ theme color ตามที่กำหนด:

- **#900F0F** (แดงเข้มที่สุด) - Header, Navigation, ปุ่มสำคัญ
- **#B20000** (แดงกลาง) - ปุ่มรอง, เส้นขอบ, ไอคอนสำคัญ  
- **#E36264** (แดงอ่อน) - Background notification, Hover effects
- **#FFFFFF** (ขาว) - พื้นหลังหลัก, ตัวอักษรบนพื้นสีแดง

## 🚀 User Experience Features

### ✨ การออกแบบที่เน้นประสบการณ์ผู้ใช้

1. **Progressive Disclosure** - แสดงข้อมูลแบบทีละขั้นตอน
2. **Real-time Feedback** - คำนวณราคาแบบ real-time
3. **Visual Hierarchy** - ใช้สี, ขนาดตัวอักษร, และ spacing อย่างมีระบบ
4. **Micro-interactions** - Hover effects, Loading states, Success animations
5. **Responsive Design** - ใช้งานได้ทุกขนาดหน้าจอ

### 🎯 Workflow ที่ใช้งานง่าย

1. **เลือกงาน** → Modal แสดงงานทั้งหมดของลูกค้า
2. **กรอกราคา** → Form แบบ step-by-step
3. **ดูตัวอย่าง** → Preview modal พร้อมพิมพ์
4. **ส่งตรวจสอบ** → บันทึกและส่งต่อ

## 🛠️ Technical Features

### Print Optimization
- A4 layout สำหรับพิมพ์
- CSS media queries สำหรับ print
- ซ่อน UI elements ที่ไม่จำเป็นเมื่อพิมพ์

### Performance  
- Component splitting เพื่อลด bundle size
- Memoization สำหรับ expensive calculations
- Lazy loading สำหรับ modal components

### Accessibility
- Keyboard navigation support
- Screen reader friendly
- High contrast colors
- ARIA labels
