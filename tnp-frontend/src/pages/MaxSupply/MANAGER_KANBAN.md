# Manager Kanban Board

## Overview
หน้า Manager ใหม่ที่เปลี่ยนมาจาก Messages เพื่อจัดการงาน Max Supply แบบ Kanban Board ตามรูปแบบที่ออกแบบไว้

## Features

### 📋 **Kanban Board Layout**
- **3 คอลัมน์หลัก:**
  - **In Progress** (สีเหลือง) - งานที่กำลังดำเนินการ (status: pending)
  - **In Review** (สีม่วง) - งานที่อยู่ระหว่างตรวจสอบ (status: in_progress)  
  - **Done** (สีเขียว) - งานที่เสร็จแล้ว (status: completed)

- **Column Headers:**
  - ชื่อคอลัมน์พร้อม icon
  - Badge แสดงจำนวนงานในคอลัมน์
  - ปุ่ม + สำหรับเพิ่มงานใหม่

### 🃏 **Job Cards**
แต่ละการ์ดงานประกอบด้วย:

**Header:**
- ชื่องาน (job title)
- ปุ่ม menu (⋮) สำหรับ actions

**Content:**
- 👤 ชื่อลูกค้า
- 🏷️ Tags:
  - Production Type (Screen 📺, DTF 📱, Sublimation ⚽, Embroidery 🧵)
  - Priority (low, normal, high, urgent)
  - จำนวนเสื้อ (ตัว)

**Footer:**
- 🕒 วันที่ครบกำหนด
- 👥 Avatar groups (ตัวย่อลูกค้า + จำนวนเสื้อ)

### ⚙️ **Job Management**

**Status Change (2 วิธี):**

*วิธีที่ 1: Drag & Drop (แนะนำ)*
- ลากการ์ดงานจากคอลัมน์หนึ่งไปยังอีกคอลัมน์หนึ่ง
- วางเพื่อเปลี่ยนสถานะอัตโนมัติ
- มี Visual feedback เมื่อลาก:
  - การ์ดจะโปร่งใส และหมุนเล็กน้อย
  - คอลัมน์เป้าหมายจะเปลี่ยนสีพื้นหลัง
  - ข้อความแนะนำ "วางงานที่นี่เพื่อเปลี่ยนเป็น..."

*วิธีที่ 2: Context Menu*
- คลิกปุ่ม menu (⋮) ที่มุมขวาบนของการ์ด
- เลือก:
  - "ย้ายไป In Progress"
  - "ย้ายไป In Review" 
  - "ย้ายไป Done"

**Delete Job:**
- คลิกปุ่ม menu (⋮)
- เลือก "ลบงาน" (สีแดง)
- ยืนยันการลบในกล่องโต้ตอบ

### 🎨 **Visual Design**

**Color Coding:**
- **Production Types:**
  - Screen: สีม่วง (#7c3aed)
  - DTF: สีน้ำเงิน (#0891b2)
  - Sublimation: สีเขียว (#16a34a)
  - Embroidery: สีแดง (#dc2626)

- **Priority Colors:**
  - Low: เขียว (#10b981)
  - Normal: เทา (#6b7280)
  - High: ส้ม (#f59e0b) 
  - Urgent: แดง (#ef4444)

**Interactive Effects:**
- Hover effects บนการ์ด (ยกขึ้น + เงา)
- Smooth transitions
- Visual feedback
- **Drag & Drop Effects:**
  - การ์ดที่ลาก: โปร่งใส 50% + หมุน 5 องศา
  - คอลัมน์เป้าหมาย: เปลี่ยนสีพื้นหลัง + border สีน้ำเงิน
  - Drop zone indicator: เส้นประสีน้ำเงิน
  - Cursor เปลี่ยนเป็น grab/grabbing

### 🔧 **Technical Implementation**

**Components:**
- `KanbanBoard.jsx` - Main component
- `JobCard` - Individual job cards
- `ColumnHeader` - Column headers with counts

**Props:**
```jsx
<KanbanBoard 
  maxSupplies={maxSupplies}
  onStatusChange={handleStatusChange}
  onDeleteJob={handleDeleteJob}
  loading={loading}
/>
```

**Drag & Drop Implementation:**
- HTML5 Drag API (native browser support)
- States: `draggedJob`, `dragOverColumn` 
- Event handlers:
  - `onDragStart` - เริ่มลาก + set ghost image
  - `onDragEnd` - รีเซ็ต states
  - `onDragOver` - ป้องกัน default behavior
  - `onDragEnter` - highlight drop zone
  - `onDragLeave` - unhighlight drop zone
  - `onDrop` - execute status change

**API Integration:**
- `maxSupplyApi.updateStatus(id, status)` - เปลี่ยนสถานะ
- `maxSupplyApi.delete(id)` - ลบงาน
- Auto-refresh หลังทำการเปลี่ยนแปลง

**Fallback Support:**
- ทำงานได้ทั้งมี/ไม่มี backend
- แสดงข้อความเตือนในโหมดสาธิต
- ใช้ข้อมูล demo จาก useFallbackData

### 📱 **Responsive Design**
- Desktop: 3 คอลัมน์เคียงข้างกัน
- Mobile: Stack คอลัมน์แนวตั้ง
- Adaptive spacing และ font sizes

### 🚀 **User Experience**

**Empty States:**
- แสดงกล่องเส้นประเมื่อไม่มีงานในคอลัมน์
- ข้อความ "ไม่มีงานในสถานะนี้"

**Loading States:**
- Skeleton loading สำหรับการ์ด
- Loading indicator ระหว่างดำเนินการ

**Toast Notifications:**
- แสดงผลสำเร็จ/ผิดพลาด
- ข้อความภาษาไทยที่เข้าใจง่าย

### 🔄 **Data Flow**
1. ข้อมูลมาจาก useMaxSupplyData hook
2. Filter งานตาม status เข้าคอลัมน์
3. Action triggers API call
4. Toast notification แสดงผล
5. Auto-refresh data

### 🎯 **Benefits**
- **Visual management** ง่ายกว่าตาราง
- **Drag & Drop** เปลี่ยนสถานะเร็วที่สุด
- **Quick status updates** ทั้งลากและ context menu
- **ภาพรวมงาน** ชัดเจนแบบ real-time
- **Modern UX/UI design** ตามมาตรฐานสากล
- **Intuitive workflow** เข้าใจง่าย ใช้งานง่าย
- **Efficient task management** ลดเวลาการทำงาน
- **Touch-friendly** สำหรับ mobile และ tablet

---

**Note:** Manager tab แทนที่ Messages tab และเป็นส่วนหนึ่งของ MaxSupplyHome component 