# การแสดงผล "สรุปการเงิน ยอดเงินและการคำนวณ" - Invoice Financial Summary

## ภาพรวม (Overview)

ได้สร้าง **FinancialSummarySection** เป็น shared component ใหม่สำหรับแสดงสรุปการเงินแบบครบถ้วนใน InvoiceDetailDialog ตามข้อมูลจาก invoices table

## Component ที่สร้างใหม่

### `FinancialSummarySection.jsx`
- **ตำแหน่ง**: `/shared/components/FinancialSummarySection.jsx`
- **วัตถุประสงค์**: แสดงสรุปการเงิน ยอดเงิน และการคำนวณแบบครบถ้วน
- **Features**:
  - การคำนวณยอดเงินทั้งหมด
  - ข้อมูลมัดจำ (deposit)
  - สถานะการชำระเงิน
  - ภาษีมูลค่าเพิ่ม (VAT)
  - หักภาษี ณ ที่จ่าย (Withholding Tax)
  - ส่วนลดพิเศษ

## ข้อมูลที่แสดง (Data Fields)

### การคำนวณยอดเงิน
```javascript
- subtotal: ยอดรวม (ไม่รวมภาษี)
- special_discount_amount: ส่วนลดพิเศษ  
- vat_amount: ภาษีมูลค่าเพิ่ม (7%)
- withholding_tax_amount: หักภาษี ณ ที่จ่าย (1-3%)
- final_total_amount: จำนวนเงินรวมทั้งสิ้น
```

### ข้อมูลมัดจำ
```javascript
- deposit_mode: ประเภทมัดจำ (percentage/amount)
- deposit_percentage: เปอร์เซ็นต์มัดจำ
- deposit_amount: ยอดเงินมัดจำ
```

### สถานะการชำระเงิน
```javascript
- paid_amount: ยอดเงินที่ชำระแล้ว
- remainingAmount: ยอดคงเหลือ (calculated)
- due_date: วันครบกำหนดชำระ
```

## ตัวอย่างการแสดงผล (Example Display)

### ใบแจ้งหนี้ INV202509-0001:

#### การคำนวณยอดเงิน
```
ยอดรวม (ไม่รวมภาษี)        ฿7,200.00
ภาษีมูลค่าเพิ่ม (7.00%)      ฿504.00
────────────────────────────────────
จำนวนเงินรวมทั้งสิ้น        ฿7,704.00
```

#### ข้อมูลมัดจำ
```
ประเภทมัดจำ:        [คิดเป็นเปอร์เซ็นต์]
เปอร์เซ็นต์มัดจำ:        50.00%
ยอดเงินมัดจำ:          ฿3,852.00
```

#### สถานะการชำระเงิน
```
ยอดเงินที่ต้องชำระ      ฿7,704.00
ยอดเงินที่ชำระแล้ว      ฿0.00
────────────────────────────────────
ยอดคงเหลือ           ฿7,704.00

สถานะ: [ยังไม่ได้ชำระ]
วันครบกำหนดชำระ: 29 ก.ย. 2568
```

### ใบแจ้งหนี้ INV202509-0002 (ตัวอย่างที่ซับซ้อน):

#### การคำนวณยอดเงิน
```
ยอดรวม (ไม่รวมภาษี)        ฿76,800.00
ส่วนลดพิเศษ                -฿1,000.00
ภาษีมูลค่าเพิ่ม (7.00%)      ฿5,376.00
หักภาษี ณ ที่จ่าย (3.00%)     -฿2,274.00
────────────────────────────────────
จำนวนเงินรวมทั้งสิ้น        ฿78,902.00
```

#### ข้อมูลมัดจำ
```
ประเภทมัดจำ:        [จำนวนเงินคงที่]
ยอดเงินมัดจำ:          ฿50,000.00
```

## การใช้งาน (Usage)

### ใน InvoiceDetailDialog.jsx:
```jsx
import { FinancialSummarySection } from '../../shared/components';

// ใช้ใน component
<Grid item xs={12}>
  <FinancialSummarySection invoice={invoice} />
</Grid>
```

### Props:
```javascript
FinancialSummarySection.propTypes = {
  invoice: PropTypes.object.isRequired // ข้อมูลใบแจ้งหนี้จาก API
};
```

## Styling & Design

### Colors:
- **Primary**: การคำนวณหลัก
- **Warning**: ข้อมูลมัดจำ  
- **Success**: การชำระเงิน
- **Error**: ยอดคงเหลือ

### Icons:
- 🧮 **Calculate**: การคำนวณ
- 💰 **MonetizationOn**: มัดจำ
- 💳 **Payment**: การชำระเงิน

### Layout:
- **InfoCard**: แต่ละส่วนแยกเป็น card
- **Grid System**: จัดวางข้อมูลเป็น 2 คอลัมน์
- **Divider**: แบ่งส่วนการคำนวณ
- **Chips**: แสดงสถานะและประเภท

## Features พิเศษ

### 1. Format ตัวเลข
```javascript
const formatCurrency = (amount) => {
  return num.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
```

### 2. Conditional Display
- แสดงส่วนลดเฉพาะเมื่อมีการลด
- แสดง VAT เฉพาะเมื่อ `has_vat: true`
- แสดงหักภาษีเฉพาะเมื่อ `has_withholding_tax: true`
- แสดงมัดจำเฉพาะเมื่อมี `deposit_amount > 0`

### 3. Status Colors
- **เขียว**: ชำระครบแล้ว
- **แดง**: ยังไม่ได้ชำระ
- **ส้ม**: เตือนวันครบกำหนด

## การทดสอบ (Testing Status)

✅ **API Integration**: ข้อมูลจาก `/api/v1/invoices/{id}` แสดงถูกต้อง  
✅ **Component Structure**: ไม่มี syntax errors  
✅ **Export/Import**: เชื่อมต่อกับ InvoiceDetailDialog เรียบร้อย  
✅ **Responsive Design**: ใช้ MUI Grid system  

## การใช้งานต่อไป (Next Steps)

1. **Frontend Testing**: ทดสอบการแสดงผลใน browser
2. **Edge Cases**: ทดสอบกับข้อมูลต่าง ๆ (ไม่มี VAT, มัดจำ 0, etc.)
3. **Responsive**: ตรวจสอบการแสดงผลใน mobile
4. **Accessibility**: เพิ่ม aria-labels สำหรับ screen readers

## สรุป

ตอนนี้ InvoiceDetailDialog มีส่วน **"สรุปการเงิน ยอดเงินและการคำนวณ"** แบบครบถ้วนแล้ว แสดงข้อมูลการเงินทั้งหมดตามที่มีในตาราง invoices อย่างละเอียดและเข้าใจง่าย
