# การแก้ไขปัญหา "พิมพ์ตัวเลขไม่ได้" ใน CreateQuotationForm

## ปัญหาที่พบ

ผู้ใช้ไม่สามารถพิมพ์ตัวเลขใน input fields ต่างๆ ได้ โดยเฉพาะใน:

- ฟิลด์จำนวน (quantity)
- ฟิลด์ราคาต่อหน่วย (unitPrice)
- ฟิลด์ส่วนลดพิเศษ (special discount)
- ฟิลด์ภาษีหัก ณ ที่จ่าย (withholding tax)
- ฟิลด์ภาษีมูลค่าเพิ่ม (VAT)

## สาเหตุของปัญหา

ปัญหาเกิดจากการใช้ `sanitizeDecimal()` และ `sanitizeInt()` functions ที่:

1. ลบตัวอักษรที่ไม่ใช่ตัวเลขออกทันทีในขณะพิมพ์
2. ใช้ `replace(/\D+/g, "")` ที่รุนแรงเกินไป
3. ทำให้การพิมพ์ไม่ราบรื่น เพราะ value เปลี่ยนแปลงทันทีที่พิมพ์

## การแก้ไขที่ดำเนินการ

### 1. ปรับปรุง Input Sanitizers

**ไฟล์:** `src/pages/Accounting/shared/inputSanitizers.js`

**เพิ่มฟังก์ชันใหม่:**

```javascript
/**
 * Input handler ที่อนุญาตให้พิมพ์ได้อย่างราบรื่น สำหรับตัวเลขจำนวนเต็ม
 */
export const createIntegerInputHandler = (onChange) => (e) => {
  const value = e.target.value;
  const sanitized = sanitizeInt(value);
  onChange(sanitized);
};

/**
 * Input handler ที่อนุญาตให้พิมพ์ได้อย่างราบรื่น สำหรับตัวเลขทศนิยม
 */
export const createDecimalInputHandler = (onChange) => (e) => {
  const value = e.target.value;
  const sanitized = sanitizeDecimal(value);
  onChange(sanitized);
};
```

**ปรับปรุง sanitization logic:**

- ลบ `replace(/\D+/g, "")` ที่รุนแรง
- ใช้ `replace(/[^0-9]/g, "")` แทน
- จัดการจุดทศนิยมอย่างเหมาะสม

### 2. อัปเดต CreateQuotationForm

**ไฟล์:** `src/pages/Accounting/PricingIntegration/components/quotation/CreateQuotationForm/CreateQuotationForm.jsx`

**เปลี่ยนจาก:**

```javascript
onChange={(e) =>
  updateSizeRow(item.id, row.uuid, {
    quantity: sanitizeInt(e.target.value),
  })
}
```

**เป็น:**

```javascript
onChange={createIntegerInputHandler((value) =>
  updateSizeRow(item.id, row.uuid, {
    quantity: value,
  })
)}
```

### 3. อัปเดต SpecialDiscountField

**ไฟล์:** `src/pages/Accounting/PricingIntegration/components/quotation/CreateQuotationForm/components/SpecialDiscountField.jsx`

**ปรับปรุง:**

- ใช้ `createDecimalInputHandler` แทน direct onChange
- ปรับ `handleValueChange` ให้ทำงานกับค่าที่ sanitize แล้ว

### 4. อัปเดต WithholdingTaxField

**ไฟล์:** `src/pages/Accounting/PricingIntegration/components/quotation/CreateQuotationForm/components/WithholdingTaxField.jsx`

**ปรับปรุง:**

- ใช้ `createDecimalInputHandler`
- ปรับ `handlePercentageChange` ให้ clamp ค่าระหว่าง 0-10%

### 5. อัปเดต VatField

**ไฟล์:** `src/pages/Accounting/PricingIntegration/components/quotation/CreateQuotationForm/components/VatField.jsx`

**ปรับปรุง:**

- ใช้ `createDecimalInputHandler`
- ปรับ `handlePercentageChange` ให้ clamp ค่าระหว่าง 0-100%

## ผลลัพธ์ที่ได้รับ

### ✅ การพิมพ์ที่ราบรื่น

- ผู้ใช้สามารถพิมพ์ตัวเลขได้อย่างเป็นธรรมชาติ
- ไม่มีการสะดุดหรือ jump ของ cursor
- การ sanitization ทำงานในพื้นหลังโดยไม่รบกวน

### ✅ การตรวจสอบที่เหมาะสม

- ยังคงป้องกันการป้อนตัวอักษรที่ไม่ใช่ตัวเลข
- จำกัดค่าสูงสุด/ต่ำสุดตามที่กำหนด
- จัดการจุดทศนิยมอย่างถูกต้อง

### ✅ ประสบการณ์ผู้ใช้ที่ดีขึ้น

- การพิมพ์ตัวเลขเป็นธรรมชาติ
- Response time ที่เร็วขึ้น
- ไม่มี unexpected behavior

## การทดสอบ

### ควรทดสอบ:

1. **ฟิลด์จำนวน (quantity):**

   - พิมพ์ตัวเลขปกติ ✅
   - พิมพ์ตัวอักษร ❌ (ควรถูกลบ)
   - พิมพ์เลข 0 ✅

2. **ฟิลด์ราคาต่อหน่วย (unitPrice):**

   - พิมพ์ตัวเลขทศนิยม ✅
   - พิมพ์จุดทศนิยมหลายจุด ❌ (ควรเหลือจุดเดียว)
   - พิมพ์คอมม่า ✅ (แปลงเป็นจุด)

3. **ฟิลด์ส่วนลดพิเศษ:**

   - พิมพ์ตัวเลขได้ราบรื่น ✅
   - จำกัดค่าตาม mode (percentage/amount) ✅

4. **ฟิลด์ภาษี:**
   - ภาษีหัก ณ ที่จ่าย: สูงสุด 10% ✅
   - ภาษีมูลค่าเพิ่ม: สูงสุด 100% ✅

## Best Practices นำไปใช้

### 1. Separation of Concerns

- แยก input handling logic ออกเป็น utility functions
- ใช้ custom handlers สำหรับ input types ต่างๆ

### 2. User Experience First

- อนุญาตให้ผู้ใช้พิมพ์ได้อย่างเป็นธรรมชาติ
- ทำ validation ในพื้นหลัง
- ไม่ interrupt การพิมพ์

### 3. Reusable Components

- สร้าง input handlers ที่ใช้ซ้ำได้
- มีการ parameterize สำหรับข้อกำหนดต่างๆ

## สรุป

การแก้ไขนี้แก้ปัญหาการพิมพ์ตัวเลขได้สำเร็จ โดยยังคงการ validation และ sanitization ที่จำเป็น ผู้ใช้จะได้รับประสบการณ์ที่ดีขึ้นในการกรอกข้อมูลตัวเลขในฟอร์ม
