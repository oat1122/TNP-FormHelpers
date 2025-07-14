# Work Capacity Calculation

## Overview
การคำนวณกำลังการผลิตและการใช้งาน (Work Capacity) สำหรับระบบ Max Supply โดยใช้ข้อมูลจากฐานข้อมูลคอลัมน์ `work_calculations`

## Production Capacities
กำลังการผลิตสูงสุดต่อวัน (งาน/วัน):
- **DTF**: 2,500 งาน/วัน
- **Screen**: 3,000 งาน/วัน  
- **Sublimation**: 500 งาน/วัน
- **Embroidery**: 400 งาน/วัน

## Calculation Logic

### 1. Current Workload
ดึงข้อมูลจากคอลัมน์ `work_calculations` ของตาราง `max_supplies`:
```json
{
  "screen": {
    "points": 2,
    "total_quantity": 150,
    "total_work": 300,
    "description": "..."
  }
}
```

### 2. Capacity Calculation
- **Daily**: กำลังการผลิตต่อวัน
- **Weekly**: กำลังการผลิตต่อวัน × 7
- **Monthly**: กำลังการผลิตต่อวัน × 30

### 3. Utilization
เปอร์เซ็นต์การใช้งาน = (งานปัจจุบัน / กำลังการผลิตต่อวัน) × 100

### 4. Remaining Capacity
กำลังการผลิตคงเหลือ = กำลังการผลิต - งานปัจจุบัน

## Work Calculations Format
ข้อมูลใน `work_calculations` มีรูปแบบดังนี้:
```json
{
  "production_type": {
    "points": number,
    "total_quantity": number,
    "total_work": number,
    "description": string
  }
}
```

## UI Components

### WorkCapacityCard
แสดงข้อมูลแบบละเอียดสำหรับแต่ละประเภทการผลิต:
- การใช้งานปัจจุบัน (Progress Bar)
- กำลังการผลิตต่อวัน/สัปดาห์/เดือน
- กำลังการผลิตคงเหลือ
- สรุปภาพรวม

### Color Coding
- **สีเขียว**: การใช้งานต่ำ (< 50%)
- **สีน้ำเงิน**: การใช้งานปานกลาง (50-69%)
- **สีส้ม**: การใช้งานสูง (70-89%)
- **สีแดง**: การใช้งานสูงมาก (≥ 90%)

## Demo Data
เมื่อ backend ไม่พร้อมใช้งาน จะใช้ข้อมูลตัวอย่าง:
- Screen: 300 งาน (10% การใช้งาน)
- DTF: 240 งาน (10% การใช้งาน)
- Sublimation: 200 งาน (40% การใช้งาน)
- Embroidery: 100 งาน (25% การใช้งาน)

## Integration
ฟีเจอร์นี้ผสานรวมเข้ากับ:
- หน้า MaxSupplyHome (Dashboard tab)
- useMaxSupplyData hook
- useFallbackData hook
- StatisticsCards component 