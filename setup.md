# 📦 ออกแบบระบบ MaxSupply 

### 🔧 โครงสร้างโฟลเดอร์ Backend (Laravel 10 API)

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/V1/MaxSupply/
│   │       ├── MaxSupplyController.php        // CRUD หลัก
│   │       ├── CalendarController.php         // ข้อมูลปฏิทิน
│   │       └── UploadController.php           // จัดการเอกสาร/รูป
│   ├── Requests/
│   │   └── MaxSupply/
│   │       ├── StoreMaxSupplyRequest.php
│   │       └── UpdateMaxSupplyRequest.php
│   ├── Resources/MaxSupply/
│   │   └── MaxSupplyResource.php
├── Models/
│   └── MaxSupply.php
├── Services/
│   └── MaxSupplyService.php
routes/
├── api.php     // route("/api/v1/max-supply")
```

### 🧠 ตารางในฐานข้อมูล (Database Tables)

* `max_supplies` : เก็บข้อมูลงานผลิต
* `max_supply_logs` : เก็บประวัติการแก้ไข
* `max_supply_files` : แนบรูป/เอกสาร

### 📘 RESTful API Design

| Method | Endpoint                       | Description      |
| ------ | ------------------------------ | ---------------- |
| GET    | /api/v1/max-supply             | ดึงงานทั้งหมด    |
| GET    | /api/v1/max-supply/{id}        | ดึงงานเดียว      |
| POST   | /api/v1/max-supply             | สร้างงานใหม่     |
| PUT    | /api/v1/max-supply/{id}        | แก้ไขงาน         |
| DELETE | /api/v1/max-supply/{id}        | ลบงาน            |
| PATCH  | /api/v1/max-supply/{id}/status | อัปเดตสถานะ      |
| GET    | /api/v1/max-supply/calendar    | ข้อมูลแสดงปฏิทิน |
| POST   | /api/v1/max-supply/upload      | อัปโหลดไฟล์แนบ   |

### 💻 Frontend React 18

โฟลเดอร์หลักใหม่:

```
src/
├── features/MaxSupply/
│   ├── maxSupplyApi.js        // tanstack query
│   ├── maxSupplySlice.js      // Zustand state
│   └── maxSupplyUtils.js
├── pages/MaxSupply/
│   ├── MaxSupplyList.jsx
│   ├── MaxSupplyForm.jsx      // ใช้สร้าง + แก้ไข
│   └── MaxSupplyCalendar.jsx
```

### ✨ Component Design

* `MaxSupplyList.jsx` : ตาราง + filter
* `MaxSupplyForm.jsx` : ดึงจาก worksheet + กรอกข้อมูล + คำนวณจุดพิมพ์
* `MaxSupplyCalendar.jsx` : React Big Calendar (แสดงตามสถานะ + duration + search)
* `FileUpload.jsx` : แนบรูปแบบ Dropzone
* `AuditDialog.jsx` : แสดงประวัติการแก้ไข

### 🧾 Flow การทำงานของระบบ (ตาม Mermaid ที่ให้)

#### 👷 พี่โจ เริ่มทำงาน:

1. ดึงข้อมูลจาก `Worksheet` ➜ `GET /api/v1/worksheet`
2. คำนวณจุดพิมพ์ (ฝั่ง client)
3. กด "สร้างงานผลิต" ➜ `POST /max-supply`
4. แก้ไข / ลบ ➜ `PUT` / `DELETE`
5. แนบไฟล์ผ่านการถ่ายรูป ➜ `POST /upload`
6. อัปเดตสถานะ ➜ `PATCH /status`
7. ระบบส่งข้อมูลไปยัง calendar ➜ `GET /calendar`

#### 🧠 ระบบเบื้องหลัง:

* ทุกการแก้ไขจะ `INSERT` ไปที่ `max_supply_logs`
* ทุก upload จะเก็บ path ใน `max_supply_files`

#### 👨‍💼 Admin:

* สามารถเข้าถึงข้อมูลทั้งหมด (รวม audit)
* จัดการได้ทั้งของตนเองและของ user คนอื่น

### 📱 Mobile

* ใช้ responsive UI จาก Tailwind + shadcn/ui
* รองรับแนบไฟล์จากมือถือ

###

---

## ✅ คำสั่งการทำงานเพิ่มเติม

> สำหรับ dev/backend:

* สร้าง migration: `php artisan make:migration create_max_supplies_table`
* สร้าง model: `php artisan make:model MaxSupply -m`
* สร้าง controller: `php artisan make:controller Api/V1/MaxSupply/MaxSupplyController`
* สร้าง resource: `php artisan make:resource MaxSupplyResource`
* สร้าง request: `php artisan make:request MaxSupply/StoreMaxSupplyRequest`

> สำหรับ frontend:

* tanstack query setup ใน `maxSupplyApi.js`
* Zustand store setup ใน `maxSupplySlice.js`
* `MaxSupplyForm` ใช้ `react-hook-form` + `zod`
* Upload ใช้ `Dropzone` + Axios

---

