# MaxSupply Management System

## Overview
หน้า MaxSupply ใหม่ที่ปรับปรุงให้มี UI/UX ที่เป็นมิตรกับผู้ใช้งาน พร้อมด้วย calendar view และระบบจัดการงานที่ทันสมัย

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
- Progress bars และ percentage indicators
- Real-time data updates

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
└── index.js                   # Export file

hooks/
└── useMaxSupplyData.js        # Custom hook for data management
```

### Custom Hook: useMaxSupplyData
- จัดการ state และ API calls
- Auto-calculate statistics
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

## Usage
1. เข้าหน้า `/max-supply` 
2. เลือก tab ที่ต้องการ (Dashboard หรือ Calendar)
3. ดูข้อมูลสถิติใน Dashboard
4. ดูปฏิทินงานใน Calendar tab
5. คลิก "Create a job" เพื่อสร้างงานใหม่
6. คลิกที่งานในปฏิทินเพื่อดูรายละเอียด

## Responsive Design
- Mobile-first approach
- Tablet และ desktop optimized
- Touch-friendly interface
- Optimized performance สำหรับทุกขนาดหน้าจอ 