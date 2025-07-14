# Date Filtering Fix Documentation

## ปัญหาที่พบ
- Backend ไม่ได้ใช้ Carbon::parse() สำหรับการกรองวันที่
- ไม่มีการ startOfDay() และ endOfDay() ทำให้การกรองไม่ครอบคลุมทั้งวัน
- Frontend ส่งข้อมูลแต่ไม่มี debug logs ที่ชัดเจน

## การแก้ไขที่ทำ

### 1. Backend (Laravel)

#### MaxSupply Model (`app/Models/MaxSupply.php`)
```php
// เพิ่ม import Carbon
use Carbon\Carbon;

// ปรับปรุง scope สำหรับการกรองวันที่
public function scopeByDateRange($query, $start, $end)
{
    // กรองตาม start_date (วันที่เริ่มงาน)
    return $query->whereBetween('start_date', [
        Carbon::parse($start)->startOfDay(),
        Carbon::parse($end)->endOfDay()
    ]);
}

public function scopeByCompletionDateRange($query, $start, $end)
{
    // กรองตาม expected_completion_date (วันที่คาดว่าจะเสร็จ)
    return $query->whereBetween('expected_completion_date', [
        Carbon::parse($start)->startOfDay(),
        Carbon::parse($end)->endOfDay()
    ]);
}

public function scopeByCreatedDateRange($query, $start, $end)
{
    // กรองตาม created_at (วันที่สร้าง)
    return $query->whereBetween('created_at', [
        Carbon::parse($start)->startOfDay(),
        Carbon::parse($end)->endOfDay()
    ]);
}
```

#### MaxSupplyController (`app/Http/Controllers/Api/V1/MaxSupply/MaxSupplyController.php`)
```php
// รองรับการเลือกประเภทวันที่ที่จะกรอง
if ($request->filled('date_from') && $request->filled('date_to')) {
    $dateType = $request->input('date_type', 'start_date');
    
    switch ($dateType) {
        case 'completion_date':
            $query->byCompletionDateRange($request->date_from, $request->date_to);
            break;
        case 'created_at':
            $query->byCreatedDateRange($request->date_from, $request->date_to);
            break;
        default:
            $query->byDateRange($request->date_from, $request->date_to);
            break;
    }
}
```

### 2. Frontend (React)

#### MaxSupplyList.jsx
```javascript
// เพิ่ม debug logs ที่ชัดเจนขึ้น
console.log("Current filters state:", filters);
console.log("Filter params being sent to API:", params);
```

## วิธีการทดสอบ

### 1. ตรวจสอบ Console Logs
เปิด Developer Tools และดู Console เมื่อกรองข้อมูล:
```
Filter changed: date_from = 2025-01-01
Filter changed: date_to = 2025-01-31
Current filters state: {search: "", status: "all", date_from: "2025-01-01", ...}
Filter params being sent to API: {page: 1, per_page: 10, date_from: "2025-01-01", date_to: "2025-01-31"}
```

### 2. ตรวจสอบ Network Tab
ดู Request URL ใน Network Tab:
```
GET /api/v1/max-supplies?page=1&per_page=10&sort_by=created_at&sort_order=desc&date_from=2025-01-01&date_to=2025-01-31
```

### 3. ตรวจสอบ Backend Logs
```bash
tail -f storage/logs/laravel.log
```

## API Parameters ที่รองรับ

### Date Filtering
- `date_from`: วันที่เริ่มต้น (YYYY-MM-DD)
- `date_to`: วันที่สิ้นสุด (YYYY-MM-DD)
- `date_type`: ประเภทวันที่ที่จะกรอง
  - `start_date` (default): กรองตามวันที่เริ่มงาน
  - `completion_date`: กรองตามวันที่คาดว่าจะเสร็จ
  - `created_at`: กรองตามวันที่สร้างงาน

### ตัวอย่างการใช้งาน
```javascript
// กรองงานที่เริ่มในเดือนมกราคม 2025
const params = {
  date_from: "2025-01-01",
  date_to: "2025-01-31",
  date_type: "start_date"
};

// กรองงานที่คาดว่าจะเสร็จในสัปดาห์นี้
const params = {
  date_from: "2025-07-14",
  date_to: "2025-07-20", 
  date_type: "completion_date"
};
```

## สิ่งที่ควรตรวจสอบเพิ่มเติม

1. **Timezone**: ตรวจสอบว่า Carbon ใช้ timezone ที่ถูกต้อง
2. **Database Indexes**: เพิ่ม index ใน columns ที่ใช้กรอง (`start_date`, `expected_completion_date`)
3. **Performance**: ตรวจสอบ query performance เมื่อมีข้อมูลเยอะ

## การแก้ไขปัญหาเพิ่มเติม

หากยังมีปัญหา ให้ตรวจสอบ:

1. **Format วันที่จาก Frontend**:
```javascript
// ตรวจสอบว่าส่งเป็น YYYY-MM-DD
console.log("Date format:", filters.date_from); // ควรเป็น "2025-01-01"
```

2. **Database Date Fields**:
```sql
-- ตรวจสอบข้อมูลในฐานข้อมูล
SELECT id, start_date, expected_completion_date, created_at 
FROM max_supplies 
WHERE start_date BETWEEN '2025-01-01' AND '2025-01-31';
```

3. **Laravel Query Log**:
```php
// เพิ่มใน Controller เพื่อดู SQL query
\DB::enableQueryLog();
$maxSupplies = $query->paginate($perPage);
dd(\DB::getQueryLog());
```
