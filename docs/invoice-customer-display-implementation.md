# การแสดงผลข้อมูลลูกค้า - Invoice Customer Display Implementation

## ภาพรวม (Overview)

การแสดงผลข้อมูลลูกค้าในใบแจ้งหนี้ (Invoice) ได้รับการปรับปรุงให้แสดงข้อมูลจากตาราง `master_customers` ผ่านความสัมพันธ์ระหว่าง `tnpdb.invoices.customer_id` กับ `tnpdb.master_customers.cus_id`

## การเปลี่ยนแปลงที่ดำเนินการ (Changes Implemented)

### 1. Backend API - InvoiceController.php ✅
- **เพิ่มความสัมพันธ์ customer**: เพิ่ม `'customer'` ใน `with()` method ของ `show()` function
- **ข้อมูลที่โหลด**: ข้อมูลจาก `master_customers` table ทั้งหมด
- **เส้นทาง API**: `/api/v1/invoices/{id}` ตอบกลับพร้อมข้อมูลลูกค้าครบถ้วน

### 2. Frontend Components

#### A. InvoiceDetailDialog.jsx ✅
```javascript
// ปรับปรุงฟังก์ชัน normalizeCustomer ให้ใช้ข้อมูลจาก master_customers
const normalizeCustomer = (invoice) => {
  const customer = invoice.customer; // ใช้ความสัมพันธ์จาก API
  return {
    customer_type: customer.cus_company ? 'company' : 'individual',
    cus_name: customer.cus_name,
    cus_firstname: customer.cus_firstname,
    cus_lastname: customer.cus_lastname,
    cus_company: customer.cus_company,
    cus_tel_1: customer.cus_tel_1,
    cus_tel_2: customer.cus_tel_2,
    cus_email: customer.cus_email,
    cus_tax_id: customer.cus_tax_id,
    cus_address: customer.cus_address,
    cus_zip_code: customer.cus_zip_code,
    cus_depart: customer.cus_depart,
    // ...
  };
};
```

#### B. CustomerSection.jsx ✅
- **เพิ่มแสดงแผนก**: แสดง `cus_depart` ถ้ามีข้อมูล
- **เพิ่มเบอร์โทรศัพท์ที่ 2**: แสดง `cus_tel_2` เป็น Chip สีรอง
- **รวมรหัสไปรษณีย์**: แสดง `cus_zip_code` ร่วมกับที่อยู่
- **การจัดการประเภทลูกค้า**: แยกแสดงข้อมูลตามประเภท individual/company

## ข้อมูลลูกค้าที่แสดง (Customer Information Displayed)

### สำหรับบริษัท (Company)
- ชื่อบริษัท (`cus_company`)
- ผู้ติดต่อ (`cus_firstname` + `cus_lastname`)
- ชื่อเล่น (`cus_name`)
- แผนก (`cus_depart`)
- โทรศัพท์หลัก (`cus_tel_1`)
- โทรศัพท์รอง (`cus_tel_2`)
- อีเมล (`cus_email`)
- เลขประจำตัวผู้เสียภาษี (`cus_tax_id`)
- ที่อยู่ + รหัสไปรษณีย์ (`cus_address` + `cus_zip_code`)

### สำหรับบุคคล (Individual)
- ชื่อ-นามสกุล (`cus_firstname` + `cus_lastname`)
- ชื่อเล่น (`cus_name`)
- โทรศัพท์ (`cus_tel_1`, `cus_tel_2`)
- อีเมล (`cus_email`)
- ที่อยู่ + รหัสไปรษณีย์ (`cus_address` + `cus_zip_code`)

## ตัวอย่างข้อมูลที่แสดง (Example Data)

จากการทดสอบ API กับ Invoice ID: `027a3d5f-8f9b-431d-92ad-ef6170ce3d81`

```json
{
  "customer": {
    "cus_firstname": "Nicharee",
    "cus_lastname": "Kaewnimit", 
    "cus_name": "(Prae)",
    "cus_depart": "hr",
    "cus_company": "The KE Group Co., Ltd",
    "cus_tel_1": "0636354749",
    "cus_tel_2": "021015104", 
    "cus_email": "nicharee.k@allyglobal.com",
    "cus_zip_code": "10240",
    "cus_address": "แขวงคลองจั่น เขตเขตบางกะปิ กรุงเทพฯ 10240"
  }
}
```

## การแสดงผลใน UI

### ส่วนหัวลูกค้า
- **ชื่อบริษัท**: "The KE Group Co., Ltd"
- **แผนก**: "hr"
- **โทรศัพท์**: 🏷️ `0636354749` 🏷️ `021015104`

### รายละเอียดลูกค้า
- **ผู้ติดต่อ**: Nicharee Kaewnimit (Prae)
- **อีเมล**: nicharee.k@allyglobal.com
- **ที่อยู่**: แขวงคลองจั่น เขตเขตบางกะปิ กรุงเทพฯ 10240

## สถานะการทำงาน (Status)

✅ **API Backend**: ความสัมพันธ์ customer ทำงานถูกต้อง  
✅ **Frontend Components**: การแสดงผลข้อมูลลูกค้าครบถ้วน  
✅ **Data Mapping**: การเชื่อมโยงข้อมูลจาก master_customers ถูกต้อง  
✅ **UI Display**: การแสดงผลใน InvoiceDetailDialog สมบูรณ์  

## การทดสอบ (Testing)

```bash
# ทดสอบ API
curl -X GET "http://localhost:8000/api/v1/invoices/027a3d5f-8f9b-431d-92ad-ef6170ce3d81" -H "Accept: application/json"

# เริ่ม Frontend Development Server
cd tnp-frontend
npm run dev

# เปิดหน้า Invoices และคลิก "ดูรายละเอียด" เพื่อทดสอบ
```

## หมายเหตุ (Notes)

- ข้อมูลลูกค้าจะแสดงตามข้อมูลล่าสุดใน `master_customers` table
- การแสดงผลจะปรับตามประเภทลูกค้า (บุคคล/บริษัท) อัตโนมัติ
- รองรับการแสดงหลายเบอร์โทรศัพท์
- แสดงข้อมูลแผนกสำหรับลูกค้าประเภทบริษัท
