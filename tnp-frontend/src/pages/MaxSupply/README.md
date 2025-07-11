# MaxSupply Management System

## Overview
หน้า MaxSupply ใหม่ที่ปรับปรุงให้มี UI/UX ที่เ### Production Types
- **Screen Printing** (📺): สกรีน
- **DTF** (📱): Direct to Film Transfer  
- **Sublimation** (⚽): พิมพ์ซับลิเมชั่น
- **Embroidery** (🧵): งานปัก

**การนับจำนวนงาน**: ตอนนี้ระบบนับจำนวนงานจาก `work_calculations` แทนการใช้ `production_type` แบบเดิม
- แต่ละงานที่มี `work_calculations` จะนับจำนวนงานตามประเภทการผลิตที่มี `total_work > 0`
- ตัวอย่าง: ถ้างานหนึ่งมีทั้ง Screen (60 งาน) และ DTF (120 งาน) จะนับเป็น Screen 1 งาน, DTF 1 งานตรกับผู้ใช้งาน พร้อมด้วย calendar view และระบบจัดการงานที่ทันสมัย

## Features

### 🎨 Welcome Section
- Header ต้อนรับพร้อม gradient background สีอบอุ่น
- Call-to-action สำหรับ Premium features
- Responsive design สำหรับทุกขนาดหน้าจอ

### 📋 Navigation Tabs
- **Dashboard**: แสดงสถิติและภาพรวมของงาน
- **Calendar**: แสดงปฏิทินงานแบบ monthly view
- **Messages**: (Coming soon) ระบบข้อความ

### 📅 Calendar View
- Monthly calendar พร้อมการแสดงงานในแต่ละวัน
- Navigation controls (Previous/Next month, Today)
- View mode selection (Month/Week/Day)
- Event display พร้อมสีแสดงประเภทการผลิต
- Create job button สำหรับสร้างงานใหม่

### 📊 Dashboard Statistics
- Job overview cards แสดงสถิติตามสถานะ
- Production type breakdown
- **Work Capacity Analysis**: คำนวณกำลังการผลิตจากข้อมูล work_calculations
  - Max Supply per Day/Week/Month สำหรับแต่ละประเภทการผลิต
  - DTF: 2,500 งานต่อวัน / 17,500 งานต่อสัปดาห์ / 75,000 งานต่อเดือน
  - Screen: 3,000 งานต่อวัน / 21,000 งานต่อสัปดาห์ / 90,000 งานต่อเดือน
  - Sublimation: 500 งานต่อวัน / 3,500 งานต่อสัปดาห์ / 15,000 งานต่อเดือน
  - Embroidery: 400 งานต่อวัน / 2,800 งานต่อสัปดาห์ / 12,000 งานต่อเดือน
- Current workload และ utilization percentage
- Remaining capacity calculations
- Progress bars และ percentage indicators
- Real-time data updates จากตาราง max_supplies

### 📌 Sidebar Features
- **Deadline Section**: แสดงงานที่ใกล้ครบกำหนดใน 7 วัน
- **Job Status Section**: สรุปจำนวนงานตามสถานะ
- Loading skeletons สำหรับ better UX

## Technical Details

### Components Structure
```
pages/MaxSupply/
├── MaxSupplyHome.jsx          # หน้าหลัก
├── MaxSupplyForm.jsx          # ฟอร์มสร้าง/แก้ไข
├── MaxSupplyList.jsx          # รายการงาน
├── MaxSupplyCalendar.jsx      # Calendar view แบบเต็ม
└── components/
    └── StepBasicInfo.jsx      # Form steps
    └── StepProductionInfo.jsx
    └── StepNotes.jsx

components/MaxSupply/
├── StatisticsCards.jsx        # Cards แสดงสถิติ
├── WorkCapacityCard.jsx       # Card แสดงกำลังการผลิตและการใช้งาน
└── index.js                   # Export file

hooks/
└── useMaxSupplyData.js        # Custom hook for data management
```

### Custom Hook: useMaxSupplyData
- จัดการ state และ API calls
- Auto-calculate statistics
- **Work Capacity Calculations**: คำนวณกำลังการผลิตจาก work_calculations column
  - ดึงข้อมูล work_calculations จาก max_supplies table
  - คำนวณ current workload สำหรับแต่ละประเภทการผลิต
  - คำนวณ utilization percentage
  - คำนวณ remaining capacity (daily/weekly/monthly)
- Error handling
- Data filtering และ sorting
- Helper functions สำหรับ calendar

### API Integration
- เชื่อมต่อกับ Laravel backend
- REST API endpoints:
  - `GET /api/v1/max-supplies` - ดึงข้อมูลงาน
  - `POST /api/v1/max-supplies` - สร้างงานใหม่
  - `GET /api/v1/max-supplies/statistics` - สถิติ
  - `GET /api/v1/calendar` - ข้อมูล calendar

### Data Flow
1. useMaxSupplyData hook จัดการการดึงข้อมูล
2. MaxSupplyHome component แสดงผล UI
3. Real-time updates เมื่อมีการเปลี่ยนแปลงข้อมูล
4. Error handling และ loading states

## Production Types
- **Screen Printing** (📺): สกรีน
- **DTF** (📱): Direct to Film Transfer  
- **Sublimation** (⚽): พิมพ์ซับลิเมชั่น
- **Embroidery** (🧵): งานปัก

## Job Statuses
- **Pending**: รอเริ่มงาน
- **In Progress**: กำลังดำเนินการ
- **Completed**: เสร็จสิ้น
- **Cancelled**: ยกเลิก

## Work Capacity Calculations

### Production Capacity Limits
ระบบคำนวณกำลังการผลิตสูงสุดสำหรับแต่ละประเภทการผลิต:

- **DTF (Direct Film Transfer)**: 2,500 งานต่อวัน
- **Screen Printing**: 3,000 งานต่อวัน  
- **Sublimation**: 500 งานต่อวัน
- **Embroidery**: 400 งานต่อวัน

### Calculation Logic
1. **Job Count**: นับจำนวนงานจาก work_calculations (แต่ละงานที่มี total_work > 0)
2. **Current Workload**: รวมงานจาก work_calculations column ในตาราง max_supplies
3. **Utilization Rate**: (Current Workload / Daily Capacity) × 100
4. **Remaining Capacity**: Daily/Weekly/Monthly Capacity - Current Workload
5. **Time Period Calculations**:
   - Weekly = Daily × 7
   - Monthly = Daily × 30

### Data Source
- ข้อมูลมาจาก column `work_calculations` ในตาราง `max_supplies`
- Format: JSON object เช่น `{"dtf": {"points": 2, "total_work": 200}, "screen": {...}}`
- Real-time calculations อัปเดตเมื่อมีการเพิ่ม/แก้ไขงาน
- **Important**: ต้องมี `work_calculations` field ใน MaxSupplyResource (Backend API)

### Calculation Example
ตัวอย่างการคำนวณจากข้อมูลจริง:

**Input Data:**
```json
{
  "screen": {
    "points": 1,
    "total_quantity": 60,
    "total_work": 60,
    "description": "Screen Printing 1 จุด เสื้อทั้งหมด 60 ตัว (1×60=60) งาน Screen Printing มีงาน 60"
  },
  "dtf": {
    "points": 2,
    "total_quantity": 60,
    "total_work": 120,
    "description": "DTF (Direct Film Transfer) 2 จุด เสื้อทั้งหมด 60 ตัว (2×60=120) งาน DTF มีงาน 120"
  }
}
```

**Calculation Results:**
- **Job Count**: Screen 1 งาน, DTF 1 งาน (นับจำนวนงานที่มีการผลิต)
- **Workload**: Screen 60 ชิ้น, DTF 120 ชิ้น (รวมชิ้นงานทั้งหมด)
- **Screen Printing:** 60 งาน / 3,000 งาน (2% utilization) → เหลือ 2,940 งาน/วัน
- **DTF:** 120 งาน / 2,500 งาน (5% utilization) → เหลือ 2,380 งาน/วัน

## Usage
1. เข้าหน้า `/max-supply` 
2. เลือก tab ที่ต้องการ (Dashboard หรือ Calendar)
3. ดูข้อมูลสถิติใน Dashboard
4. ดูข้อมูลกำลังการผลิตใน "กำลังการผลิตและการใช้งาน" card
5. ดูปฏิทินงานใน Calendar tab
6. คลิก "Create a job" เพื่อสร้างงานใหม่
7. คลิกที่งานในปฏิทินเพื่อดูรายละเอียด

### Development Testing
ในโหมด Development:
- คลิก "Test Calculation Logic" button ใน Dashboard tab เพื่อทดสอบการคำนวณ
- ดู Debug Info ใน WorkCapacityCard เพื่อดูข้อมูลดิบ
- ดู Console logs เพื่อดูรายละเอียดการคำนวณ
- ปุ่มทดสอบจะแสดงผลลัพธ์การคำนวณจากข้อมูลตัวอย่าง (Screen: 60 งาน, DTF: 120 งาน)

### Troubleshooting
หากตัวเลขแสดง 0% และไม่มีการอัปเดต:
1. **ตรวจสอบ API Response**: ดูใน Console logs ว่า API ส่ง `work_calculations` field มาหรือไม่
2. **ตรวจสอบ Database**: ยืนยันว่ามีข้อมูลใน `work_calculations` column ของตาราง `max_supplies`
3. **ตรวจสอบ Backend Resource**: ยืนยันว่า `MaxSupplyResource.php` include `work_calculations` field
4. **ตรวจสอบ Data Format**: ข้อมูล `work_calculations` ต้องเป็น valid JSON format
5. **ใช้ Sample Data**: ระบบจะเพิ่ม sample data อัตโนมัติหากไม่มีข้อมูลจริง

## Responsive Design
- Mobile-first approach
- Tablet และ desktop optimized
- Touch-friendly interface
- Optimized performance สำหรับทุกขนาดหน้าจอ 