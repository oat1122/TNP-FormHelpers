# 📦 MaxSupply Management System – สรุประบบงานผลิตแบบครบวงจร

## 🧭 ภาพรวมระบบ
ระบบ MaxSupply ช่วยจัดการงานผลิตตั้งแต่การสร้าง ดูรายการงาน คำนวณกำลังการผลิต ไปจนถึงการแสดงผลแบบ Calendar Timeline และ Kanban สำหรับผู้จัดการ

## 🧱 โครงสร้างหลักของระบบ

### 1. Dashboard
- แสดงสถิติแยกตามประเภทการผลิต
- ใช้ข้อมูลจาก `work_calculations` เพื่อคำนวณความสามารถในการผลิตและเปอร์เซ็นต์การใช้งาน
- ใช้ Progress bar และข้อมูลแบบ real-time

### 2. Calendar Timeline
- แสดงงานในรูปแบบแถบ timeline ข้ามหลายวัน
- Timeline bar มีสีตามประเภทการผลิต พร้อม hover tooltip และ interactive click
- รองรับ responsive ทุกขนาดหน้าจอ
- แสดง legend จำนวนงานแต่ละประเภทด้านบน

### 3. Kanban สำหรับผู้จัดการ
- 3 คอลัมน์: In Progress, In Review, Done
- Drag & Drop เพื่อเปลี่ยนสถานะงาน
- มี visual feedback ตอนลากวาง
- จัดการงานผ่าน context menu ได้เช่นกัน

## 🎛️ ระบบตัวกรองและการค้นหา (Filter System)

### ✅ รองรับการกรองดังนี้:
- ประเภทสถานะ: pending, in_progress, completed, cancelled
- ประเภทผลิต: screen, dtf, sublimation, embroidery
- ความสำคัญ: low, normal, high, urgent
- ประเภทวันที่: start_date, due_date, actual_completion_date, created_at, due_or_completion
- เงื่อนไขพิเศษ: overdue_only, urgent_only (เลือกได้อย่างใดอย่างหนึ่งเท่านั้น)

### ✅ คุณสมบัติเด่น:
- Date validation: วันที่เริ่มต้องไม่เกินวันสิ้นสุด
- Search auto-trim: ตัดช่องว่างอัตโนมัติ
- Console log & debug friendly
- UI ชัดเจน มี tooltip และ helper text

## 📅 Calendar Timeline Logic
- ใช้ algorithm จัดงานไม่ให้ซ้อนกัน
- คำนวณตำแหน่งซ้าย-ขวา (startCol, width)
- คำนวณแถวแนวตั้งอัตโนมัติ
- ใช้ component `EventTimelineBar` สำหรับเรนเดอร์แถบแต่ละงาน
- ใช้ absolute grid overlay บนปฏิทิน

## 🔢 การคำนวณกำลังการผลิต (Work Capacity)

### ความสามารถสูงสุดต่อวัน:
- Screen: 3,000 งาน
- DTF: 2,500 งาน
- Sublimation: 500 งาน
- Embroidery: 400 งาน

### วิธีคำนวณ:
- ดึงข้อมูลจาก `work_calculations` column
- นับ `total_work` แยกตามประเภท
- คำนวณ utilization และ capacity ที่เหลือ (รายวัน/สัปดาห์/เดือน)
- แสดงด้วย `WorkCapacityCard` และสีตามระดับการใช้งาน

## 🧩 การแยก Components
แยก component ออกจาก `MaxSupplyList.jsx` ไปยัง `components/UI/` เพื่อให้:
- อ่านง่ายขึ้น
- ทดสอบง่ายขึ้น
- Reuse ได้ในหลายหน้าจอ

**ตัวอย่าง Component:**
- `FilterBar`
- `MobileCardView`
- `DesktopTableView`
- `DetailDialog`
- `DeleteConfirmDialog`
- `LoadingSkeleton`
- `EmptyState`

## 📱 Mobile Friendly
- Floating Action Button (FAB) สำหรับสร้างงานใหม่
- Layout แบบ Card ที่อ่านง่าย
- ปุ่มและ touch target ขนาดเหมาะสม
- Responsive ทุกมุมมอง

## 📊 Visual Indicators & UX
- ใช้ไอคอน, สี และ animation บอกสถานะ
- Hover effects และ Tooltip ใช้งานง่าย
- Badges, Toast, และ Loading Skeleton ทำให้ระบบดูทันสมัย
- รองรับ Keyboard Navigation และ Screen Reader

## 🛠️ สำหรับ Developer
- React + Material UI
- ใช้ `useMaxSupplyData` hook จัดการข้อมูล
- เชื่อมต่อ Laravel Backend ผ่าน REST API
- ใช้ `date-fns` สำหรับ date manipulation
- ใช้ JSON field (`work_calculations`) สำหรับการคำนวณ

## 🧪 การทดสอบ
- มี unit และ integration tests สำหรับ calendar, filters, และ kanban
- E2E tests ครอบคลุม workflow
- ระบบ fallback data สำหรับ development
- มี console logs สำหรับ debug ทุกรูปแบบ

## 📍 การติดตั้ง
```bash
npm install
npm run dev     # สำหรับพัฒนา
npm run build   # สำหรับ production
```

## 🚀 แผนพัฒนาในอนาคต
- Drag & Drop บน Calendar
- Bulk Actions บน Table
- Export เป็น PDF/Excel
- Full-text Search
- Mobile App แยก
- PWA และ offline support