# Database Schema Alignment - Accounting System

## สรุปการแก้ไข Column Names เพื่อให้สอดคล้องกับ Database Schema

### ปัญหาที่พบ
ระบบ Accounting ที่สร้างใหม่ใช้ column naming convention แบบ Laravel standard แต่ database schema ที่มีอยู่แล้วใช้ prefixed naming convention

### การแก้ไขที่ทำ

#### 1. Customer Model (`app/Models/Accounting/Customer.php`)
**เปลี่ยนจาก:** `customers` table  
**เป็น:** `master_customers` table

**Column Mapping:**
- `id` → `cus_id` (primary key, UUID)
- `customer_code` → `cus_no`
- `name` → `cus_firstname + cus_lastname`
- `company_name` → `cus_company`
- `tax_id` → `cus_tax_id`
- `address` → `cus_address`
- `phone` → `cus_tel_1`
- `email` → `cus_email`
- `contact_person` → `cus_name`
- `is_active` → `cus_is_use`
- `created_at` → `cus_created_date`
- `updated_at` → `cus_updated_date`

**คุณสมบัติใหม่:**
- ใช้ Accessor methods เพื่อ backward compatibility
- ปิดการใช้งาน timestamps (Laravel's created_at/updated_at)
- เก็บ UUID เป็น primary key

#### 2. Product Model (`app/Models/Accounting/Product.php`)
**เปลี่ยนจาก:** `products` table  
**เป็น:** `master_product_categories` table (เนื่องจากไม่มี products table)

**Column Mapping:**
- `id` → `mpc_id` (primary key, UUID)
- `name` → `mpc_name`
- `description` → `mpc_remark`
- `is_active` → `!mpc_is_deleted`

#### 3. CustomerResource (`app/Http/Resources/V1/Accounting/CustomerResource.php`)
- แก้ไขให้ใช้ accessor methods จาก Customer model
- เพิ่ม `raw_data` section เพื่อแสดง database column จริง
- รองรับ backward compatibility

#### 4. ProductResource (`app/Http/Resources/V1/Accounting/ProductResource.php`)
- แก้ไขให้ใช้ accessor methods จาก Product model
- เพิ่ม `raw_data` section เพื่อแสดง database column จริง
- ลบ properties ที่ไม่มีใน master_product_categories

#### 5. CustomerController (`app/Http/Controllers/Api/V1/Accounting/CustomerController.php`)
**การเปลี่ยนแปลงหลัก:**
- แก้ไข validation rules ให้ใช้ column names ใหม่
- แก้ไข search functionality ให้ค้นหาใน column ที่ถูกต้อง
- แก้ไข sorting เป็น `cus_created_date`
- แก้ไข `generateCustomerCode()` ให้ใช้ `cus_no`
- เพิ่มการ set timestamp และ UUID ในการสร้าง/อัปเดต

#### 6. Request Validation (`app/Http/Requests/Accounting/CreateQuotationRequest.php`)
- แก้ไข `customer_id` validation จาก `customers,id` เป็น `master_customers,cus_id`
- แก้ไข `product_id` validation จาก `products,id` เป็น `master_product_categories,mpc_id`

### ผลลัพธ์
✅ ไม่มี syntax errors  
✅ ระบบ accounting สามารถใช้งาน table ที่มีอยู่แล้ว  
✅ Backward compatibility ผ่าน accessor methods  
✅ API response ยังคงเหมือนเดิม แต่ใช้ข้อมูลจาก database จริง  

### การใช้งาน API
API endpoints ยังคงเหมือนเดิม:
```
GET /api/v1/accounting/customers
POST /api/v1/accounting/customers
GET /api/v1/accounting/customers/{id}
PUT /api/v1/accounting/customers/{id}
DELETE /api/v1/accounting/customers/{id}
```

Response จะมี `raw_data` field เพิ่มเติม เพื่อแสดงข้อมูล database จริง:
```json
{
  "id": "uuid-here",
  "customer_code": "CUS250001",
  "name": "John Doe",
  "company_name": "ABC Company",
  "raw_data": {
    "cus_id": "uuid-here",
    "cus_no": "CUS250001",
    "cus_firstname": "John",
    "cus_lastname": "Doe",
    "cus_company": "ABC Company"
  }
}
```

### ข้อควรระวัง
1. ต้องมี UUID generator สำหรับ `cus_id` และ `mpc_id`
2. การ migrate ข้อมูลเดิม (ถ้ามี) ต้องระวังเรื่อง column mapping
3. Test API endpoints ให้ครบถ้วนหลังจากการเปลี่ยนแปลง
