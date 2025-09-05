# การแสดงชื่องานและรายการสินค้า/บริการใน InvoiceCard

## ภาพรวม (Overview)

เพิ่มการแสดงผลรายการสินค้า/บริการแบบสรุปใน InvoiceCard โดยใช้ข้อมูลจาก `items` array ของใบแจ้งหนี้ แทนที่การแสดง `work_name` เพียงอย่างเดียว

## การเปลี่ยนแปลง (Changes Made)

### 1. เพิ่มฟังก์ชัน `formatItemsList()`

```javascript
const formatItemsList = (invoice) => {
  if (!invoice) return null;
  
  // ใช้ข้อมูลจาก items ถ้ามี
  if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
    const itemNames = invoice.items
      .filter(item => item.item_name)
      .map(item => item.item_name.replace(/\(.*?\)/, '').trim()) // ลบข้อความใน ()
      .filter((name, index, array) => array.indexOf(name) === index); // ลบชื่อซ้ำ
    
    if (itemNames.length > 0) {
      const count = invoice.items.length;
      const itemsText = itemNames.join(', ');
      return `รายการสินค้า/บริการ (${count}) ${itemsText}`;
    }
  }
  
  // ถ้าไม่มี items ใช้ work_name แทน
  if (invoice.work_name) {
    return `งาน: ${invoice.work_name}`;
  }
  
  return null;
};
```

### 2. เพิ่มตัวแปรในคอมโพเนนต์

```javascript
const itemsListText = formatItemsList(invoice);
```

### 3. อัปเดต UI Logic

```jsx
{itemsListText && (
  <Stack direction="row" spacing={1} alignItems="center">
    <WorkIcon fontSize="small" color="primary" />
    <TNPBodyText><strong>{itemsListText}</strong></TNPBodyText>
  </Stack>
)}
{!itemsListText && invoice?.work_name && (
  <Stack direction="row" spacing={1} alignItems="center">
    <WorkIcon fontSize="small" color="primary" />
    <TNPBodyText><strong>ชื่องาน:</strong> {invoice.work_name}</TNPBodyText>
  </Stack>
)}
```

## ตัวอย่างการแสดงผล (Examples)

### ใบแจ้งหนี้ที่มี Items (INV202509-0001)
```
🔧 รายการสินค้า/บริการ (3) เสื้อซ็อปหนา, เสื้อพนักงาน, กางเกงซ๊อปบาง
```

**ข้อมูล Items:**
- เสื้อซ็อปหนา (590 ชิ้น)
- เสื้อพนักงาน (635 ชิ้น) 
- กางเกงซ๊อปบาง (740 ชิ้น)

### ใบแจ้งหนี้ที่มี Item เดียว (INV202509-0001)
```
🔧 รายการสินค้า/บริการ (1) เสื้อเชิ้ต
```

**ข้อมูล Item:**
- เสื้อเชิ้ต(tests) → แสดงเป็น "เสื้อเชิ้ต" (ลบ "(tests)")

### ใบแจ้งหนี้ที่ไม่มี Items (Fallback)
```
🔧 ชื่องาน: เสื้อเชิ้ต
```

## Features ของฟังก์ชัน

### 1. **ลบข้อความใน ()** 
```javascript
item.item_name.replace(/\(.*?\)/, '').trim()
// "เสื้อเชิ้ต(tests)" → "เสื้อเชิ้ต"
```

### 2. **ลบชื่อซ้ำ**
```javascript
.filter((name, index, array) => array.indexOf(name) === index)
// หากมีสินค้าชื่อเดียวกันหลายรายการ จะแสดงแค่ครั้งเดียว
```

### 3. **นับจำนวนรายการ**
```javascript
const count = invoice.items.length;
// แสดงจำนวนรายการทั้งหมด ไม่ใช่จำนวนชื่อที่ไม่ซ้ำ
```

### 4. **Fallback Logic**
```javascript
// 1. ถ้ามี items ใช้ items
// 2. ถ้าไม่มี items ใช้ work_name  
// 3. ถ้าไม่มีทั้งคู่ ไม่แสดงอะไร
```

## การทำงานกับข้อมูลจริง

### จาก API Response:
```json
"work_name": "เสื้อซ็อปหนา, เสื้อพนักงาน, กางเกงซ๊อปบาง",
"items": [
  {"item_name": "เสื้อซ็อปหนา", "quantity": 590},
  {"item_name": "เสื้อพนักงาน", "quantity": 635}, 
  {"item_name": "กางเกงซ๊อปบาง", "quantity": 740}
]
```

### การแสดงผล:
```
🔧 รายการสินค้า/บริการ (3) เสื้อซ็อปหนา, เสื้อพนักงาน, กางเกงซ๊อปบาง
```

## ประโยชน์ (Benefits)

1. **ข้อมูลละเอียดขึ้น**: แสดงจำนวนรายการและชื่อสินค้าแต่ละรายการ
2. **ความยืดหยุ่น**: รองรับทั้งกรณีมี items และไม่มี items
3. **การแสดงผลที่ดีขึ้น**: ลบข้อความที่ไม่จำเป็น เช่น "(tests)"
4. **ป้องกันข้อมูลซ้ำ**: หากมีสินค้าชื่อเดียวกันจะแสดงครั้งเดียว
5. **รูปแบบสม่ำเสมอ**: ใช้รูปแบบเดียวกันทั้งหมดใน InvoiceCard

## เงื่อนไขการแสดงผล

| สถานการณ์ | การแสดงผล |
|-----------|------------|
| มี items array | `รายการสินค้า/บริการ (n) ชื่อ1, ชื่อ2, ชื่อ3` |
| ไม่มี items แต่มี work_name | `ชื่องาน: work_name` |
| ไม่มีทั้งคู่ | ไม่แสดงส่วนนี้ |

## สถานะ (Status)

✅ **ฟังก์ชันเสร็จสิ้น**: การสร้างและเรียกใช้ `formatItemsList()`  
✅ **UI Integration**: แสดงผลใน InvoiceCard แล้ว  
✅ **Fallback Logic**: รองรับกรณีไม่มี items  
✅ **Data Processing**: ลบข้อความใน () และชื่อซ้ำ  
✅ **Testing Ready**: พร้อมทดสอบกับข้อมูลจริง  

การแก้ไขนี้จะทำให้ InvoiceCard แสดงข้อมูลรายการสินค้า/บริการได้อย่างละเอียดและครบถ้วนมากขึ้น
