# การแก้ไขการรันตัวเลขหัวกระดาษให้สอดคล้องกันทั้ง 2 บริษัท

## วันที่: 17 กันยายน 2025

## ปัญหาที่พบ
การรันตัวเลขหัวกระดาษของเอกสาร (ใบเสนอราคา, ใบแจ้งหนี้, ฯลฯ) ไม่สอดคล้องกันระหว่าง 2 บริษัท:
- **บริษัท ธน พลัส 153 จำกัด** (`2f5cd087-a00e-42eb-b041-2da71f6bb73c`)  
- **บริษัท ทีเอ็นพี เอ็นเตอร์ไพรส์ จำกัด** (`3310259c-1a88-461b-97ec-991acb2e78ae`)

### ข้อมูลเดิมใน document_sequences (ก่อนแก้ไข):
```
- ทีเอ็นพี quotation 2025/8: 2
- ธน พลัส invoice 2025/9: 5  
- ธน พลัส quotation 2025/8: 8
- ธน พลัส quotation 2025/9: 8
- ทีเอ็นพี invoice 2025/9: 2
- ทีเอ็นพี quotation 2025/8: 8
- ทีเอ็นพี quotation 2025/9: 2
```

**ปัญหา:** เลขรันของบริษัท ธน พลัส สูงกว่าบริษัท ทีเอ็นพี ทำให้เลขเอกสารไม่ต่อเนื่องและสับสนในการติดตาม

## การแก้ไข

### 1. แก้ไขไฟล์ `DocumentNumberService.php`

**ที่ตั้ง:** `tnp-backend/app/Services/Support/DocumentNumberService.php`

**การเปลี่ยนแปลงหลัก:**
- เพิ่มการตรวจสอบ **Global Maximum Sequence** ข้ามทุกบริษัทในประเภทเอกสาร/ปี/เดือนเดียวกัน
- ใช้หมายเลขถัดไปจาก Global Maximum แทนการใช้หมายเลขของแต่ละบริษัทแยกกัน
- อัปเดตหมายเลข `last_number` ของบริษัททั้งหมดให้สอดคล้องกัน

### 2. โค้ดที่เปลี่ยนแปลง

#### การเพิ่ม Global Maximum Check:
```php
// Find the global maximum sequence number across all companies for this doc type, year, month
$globalMaxSeq = DocumentSequence::where([
    'doc_type' => $docType,
    'year' => (int)$year,
    'month' => (int)$month,
])->max('last_number') ?? 0;

// Find next available number starting from global max + 1
$seqNumber = $globalMaxSeq + 1;
```

#### การตรวจสอบ Global Uniqueness:
```php
// Check across ALL companies to ensure global uniqueness
$allNumbers = DB::table($table)
    ->where('number', 'like', $prefix . '-%')
    ->pluck('number')
    ->all();
```

#### การ Sync ระหว่างบริษัท:
```php
// Update all other companies' sequences for this doc_type/year/month to maintain consistency
DocumentSequence::where([
    'doc_type' => $docType,
    'year' => (int)$year,
    'month' => (int)$month,
])->where('company_id', '!=', $companyId)
->update(['last_number' => DB::raw("GREATEST(last_number, $seqNumber)")]);
```

## ผลการทดสอบ

### การทดสอบครั้งที่ 1:
```
Before changes:
- ทีเอ็นพี quotation 2025/9: 2
- ธน พลัส quotation 2025/9: 8

Generating new numbers:
Company 1 (ธน พลัส): QT202509-0009
Company 2 (ทีเอ็นพี): QT202509-0010

After changes:
- ทีเอ็นพี quotation 2025/9: 10  
- ธน พลัส quotation 2025/9: 10
```

### การทดสอบครั้งที่ 2:
```
Generating new numbers:
Company 1 (ธน พลัส): QT202509-0011
Company 2 (ทีเอ็นพี): QT202509-0012

After changes:  
- ทีเอ็นพี quotation 2025/9: 12
- ธน พลัส quotation 2025/9: 12
```

## ผลลัพธ์

✅ **สำเร็จ:** การรันตัวเลขหัวกระดาษของทั้ง 2 บริษัทสอดคล้องกันแล้ว  
✅ **ไม่มี Gap:** หมายเลขเอกสารต่อเนื่องและไม่มีช่องว่าง  
✅ **Thread-Safe:** ใช้ `lockForUpdate()` ป้องกัน Race Condition  
✅ **Backward Compatible:** ไม่กระทบกับเอกสารเก่าที่มีอยู่แล้ว

## หมายเหตุ

- การแก้ไขนี้มีผลกับการสร้างเอกสารใหม่เท่านั้น เอกสารเก่าจะคงหมายเลขเดิม
- หมายเลขจะยังคงมีรูปแบบเดิม: `{PREFIX}{YYYYMM}-{NNNN}` เช่น `QT202509-0001`
- ระบบยังคงแยกการนับตาม company_id แต่จะ sync กันให้สอดคล้อง
- ใช้ตาราง `document_sequences` ตามที่มีอยู่ ไม่ต้องแก้ไข schema