# Worksheet Filter System Documentation

## 📋 Overview

ระบบ Filter สำหรับ Worksheet ที่เพิ่มเข้ามาใหม่ ให้ผู้ใช้สามารถกรองข้อมูล Worksheet ได้อย่างเฉพาะเจาะจง โดยไม่ทับซ้อนกับระบบ Search เดิมที่มีอยู่แล้ว

## 🎯 Features ที่เพิ่มเข้ามา

### 1. **Sales Name Filter**

- กรองงานตาม Sales Name ที่รับผิดชอบ
- แสดงเฉพาะ Sales Name ที่มีอยู่จริงในระบบ
- รองรับการเลือก "All Sales" เพื่อแสดงทั้งหมด

### 2. **Status Filter**

- กรองงานตามสถานะ: `Complete`, `Waiting Manager`, `Waiting Manager Approve`, `Editing`
- รองรับการเลือก "All Status" เพื่อแสดงทั้งหมด
- แสดงผลด้วยสีที่แตกต่างตามสถานะ

## 🔧 Technical Implementation

### Files ที่สร้างใหม่:

- `src/pages/Worksheet/WorksheetFilter.jsx` - Filter component หลัก

### Files ที่แก้ไข:

- `src/pages/Worksheet/WorksheetList.jsx` - เพิ่ม filter functionality
- `src/pages/Worksheet/Worksheet.css` - เพิ่ม styles สำหรับ filter

## 🎨 UI/UX Features

### Filter Component มีความสามารถ:

1. **Dynamic Options**: ดึง Sales Name จาก data จริงโดยอัตโนมัติ
2. **Active Filter Indicators**: แสดง Chips สำหรับ filter ที่เลือก
3. **Clear All Button**: ปุ่มล้าง filter ทั้งหมดในครั้งเดียว
4. **Individual Clear**: ลบ filter แต่ละตัวได้ผ่าน chip
5. **Responsive Design**: รองรับทั้ง desktop และ mobile

### Filter Logic:

```javascript
// การกรองข้อมูลทำแบบ AND logic
const filtered = data.filter((item) => {
  // กรองตาม role ก่อน (existing logic)
  // กรองตาม keyword search (existing logic)
  // กรองตาม Sales Name (ถ้าเลือก)
  // กรองตาม Status (ถ้าเลือก)
  return passAllFilters;
});
```

## 🚀 การใช้งาน

### สำหรับผู้ใช้:

1. เปิดหน้า Worksheet List
2. ใช้ Filter bar ด้านบนเพื่อเลือกเงื่อนไข:
   - เลือก Sales Name ที่ต้องการ
   - เลือก Status ที่ต้องการ
3. Filter จะทำงานทันทีเมื่อเลือก
4. ใช้ "Clear All" เพื่อล้าง filter ทั้งหมด

### Integration กับระบบเดิม:

- **ไม่กระทบ** กับ search functionality เดิม
- **ไม่กระทบ** กับ role-based filtering
- **ไม่กระทบ** กับ infinite scrolling
- **รองรับ** การทำงานร่วมกับ keyword search

## 📱 Responsive Design

### Desktop:

- Filter แสดงในบรรทัดเดียว (2 dropdowns + active chips)
- Chips แสดงด้านขวา

### Mobile:

- Filter แสดงแบบ stacked (แต่ละอันอยู่บรรทัดใหม่)
- Chips แสดงด้านล่าง

## 🔍 Filter Behavior

### เมื่อใช้ร่วมกับ Search:

```
Search: "customer name" + Sales Filter: "John" + Status Filter: "Complete"
= แสดงเฉพาะงานที่:
  - ชื่อลูกค้าหรือรายละเอียดตรงกับ "customer name"
  AND Sales Name = "John"
  AND Status = "Complete"
```

### Performance Optimization:

- ใช้ `useCallback` สำหรับ filter handlers
- ใช้ `useMemo` สำหรับ sales name options
- Reset card limit เมื่อ filter เปลี่ยน

## 🎯 ข้อดีของระบบ Filter ใหม่

1. **ไม่ทับซ้อน**: ทำงานร่วมกับ search เดิมได้
2. **User-friendly**: UI ง่าย เข้าใจง่าย
3. **Performance**: กรองที่ frontend ทำให้เร็ว
4. **Flexible**: เพิ่ม filter เงื่อนไขใหม่ได้ง่าย
5. **Consistent**: ใช้ design system เดียวกับระบบอื่น

## 🔮 Future Enhancements

สามารถเพิ่มเติมได้ในอนาคต:

- Date Range Filter
- Customer Filter
- Multiple Selection Filters
- Save Filter Presets
- URL-based Filter State
