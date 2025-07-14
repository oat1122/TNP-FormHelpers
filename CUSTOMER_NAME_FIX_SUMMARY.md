# 🔧 แก้ไขปัญหาการแก้ไขชื่อลูกค้า (customer_name) ใน MaxSupply

## 🚩 ปัญหาที่พบ
1. ไม่สามารถแก้ไขชื่อลูกค้า (customer_name) ได้
2. ค่าชื่อลูกค้าถูก autofill จาก worksheet แต่ไม่มีการ sync เมื่อแก้ไข
3. ไม่มีการเรียก API เพื่อดึง/อัปเดตข้อมูลล่าสุดของ worksheet

## ✅ การแก้ไขที่ดำเนินการ

### 1. Backend Fixes
- **UpdateMaxSupplyRequest.php**: เพิ่ม validation rule สำหรับ `customer_name`
  ```php
  'customer_name' => 'nullable|string|max:255',
  ```

### 2. Frontend Fixes
- **MaxSupplyEditForm.jsx**: แก้ไขครอบคลุม

#### 2.1 เพิ่ม Import และ API Integration
```javascript
import { useGetWorksheetQuery } from '../../features/Worksheet/worksheetApi';
```

#### 2.2 Real-time Worksheet Data Fetching
```javascript
const { data: worksheetData } = useGetWorksheetQuery(
  item?.worksheet_id, 
  { skip: !item?.worksheet_id }
);
```

#### 2.3 Auto-sync Customer Name from Worksheet
```javascript
useEffect(() => {
  if (worksheetData?.data?.customer_name) {
    setFormData(prev => ({
      ...prev,
      customer_name: worksheetData.data.customer_name,
    }));
  }
}, [worksheetData]);
```

#### 2.4 Fallback Function
```javascript
const getCustomerName = () => {
  if (formData.customer_name?.trim()) {
    return formData.customer_name;
  }
  if (worksheetData?.data?.customer_name?.trim()) {
    return worksheetData.data.customer_name;
  }
  if (item?.customer_name?.trim()) {
    return item.customer_name;
  }
  return '';
};
```

#### 2.5 Enhanced TextField
- เพิ่ม helper text ที่อธิบายการทำงาน
- ใช้ fallback function สำหรับ value
- เพิ่ม placeholder

#### 2.6 Enhanced Form Submission
- ส่ง customer_name ทุกครั้งที่มีค่า
- ใช้ fallback function เพื่อความมั่นใจ

#### 2.7 Smart Reset Function
- รีเซ็ตค่า customer_name จาก worksheet หากมี
- fallback ไปค่าเดิมหากไม่มีข้อมูล worksheet

#### 2.8 User Experience Improvements
- แสดง Alert สถานะการโหลด worksheet
- ข้อความแจ้งความสามารถในการแก้ไข

## 🎯 ประสิทธิภาพที่เพิ่มขึ้น

### ✅ ก่อนแก้ไข
- ❌ ไม่สามารถแก้ไข customer_name ได้
- ❌ ไม่มี real-time sync จาก worksheet
- ❌ ไม่มี fallback mechanism
- ❌ UX ไม่ชัดเจน

### ✅ หลังแก้ไข
- ✅ แก้ไข customer_name ได้อย่างอิสระ
- ✅ Auto-sync จาก worksheet เมื่อมีข้อมูล
- ✅ Fallback mechanism ป้องกันข้อมูลหาย
- ✅ UX ชัดเจน มี feedback ให้ผู้ใช้
- ✅ Validation ครอบคลุม
- ✅ Backend รองรับการอัปเดต

## 🧪 การทดสอบ

### Test Cases ที่ควรทดสอบ
1. **แก้ไขชื่อลูกค้าเป็นค่าใหม่** - ควรบันทึกสำเร็จ
2. **แก้ไขงานที่มี worksheet_id** - ควรโหลดชื่อลูกค้าจาก worksheet
3. **แก้ไขงานที่ไม่มี worksheet_id** - ควรใช้ค่าเดิมที่มีอยู่
4. **รีเซ็ตฟอร์ม** - ควรกลับไปค่าจาก worksheet หรือค่าเดิม
5. **Validation** - ต้องกรอกชื่อลูกค้า

### Expected Behavior
- ✅ การแก้ไขชื่อลูกค้าทำงานได้ปกติ
- ✅ ข้อมูลถูก sync จาก worksheet แบบ real-time  
- ✅ Fallback mechanism ทำงานเมื่อไม่มีข้อมูล
- ✅ UX ให้ feedback ที่ชัดเจน
- ✅ Form validation ทำงานถูกต้อง

## 📋 โครงสร้างไฟล์ที่แก้ไข

```
tnp-backend/
├── app/Http/Requests/V1/UpdateMaxSupplyRequest.php (✅ แก้ไข)

tnp-frontend/
├── src/pages/MaxSupply/MaxSupplyEditForm.jsx (✅ แก้ไข)
```

## 🚀 Next Steps
1. ทดสอบการทำงานใน development environment
2. ตรวจสอบการ sync ข้อมูลจาก worksheet API
3. ทดสอบ edge cases เช่น worksheet ที่ไม่มีข้อมูล customer_name
4. อาจพิจารณาเพิ่ม loading state สำหรับการโหลด worksheet
