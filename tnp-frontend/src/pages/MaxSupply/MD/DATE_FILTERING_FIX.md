# Enhanced Date Filtering - Updated Implementation

## 🎯 เป้าหมายใหม่
สามารถกรองข้อมูลตามวันที่ประเภทต่างๆ:
- **วันที่เริ่มงาน** (`start_date`)
- **วันที่คาดว่าจะเสร็จ** (`expected_completion_date`) 
- **วันที่ครบกำหนด** (`due_date`)
- **วันที่เสร็จจริง** (`actual_completion_date`)
- **ครบกำหนด/เสร็จจริง** (`due_or_completion`) - กรองทั้งสองแบบ
- **วันที่สร้าง** (`created_at`)

## 🔧 การแก้ไขที่ทำ

### 1. Backend (Laravel) - เพิ่ม Scopes ใหม่

#### MaxSupply Model (`app/Models/MaxSupply.php`)
```php
// เพิ่ม import Carbon
use Carbon\Carbon;

// Scope ใหม่สำหรับการกรองวันที่แบบต่างๆ
public function scopeByDueDateRange($query, $start, $end)
{
    return $query->whereBetween('due_date', [
        Carbon::parse($start)->startOfDay(),
        Carbon::parse($end)->endOfDay()
    ]);
}

public function scopeByActualCompletionDateRange($query, $start, $end)
{
    return $query->whereBetween('actual_completion_date', [
        Carbon::parse($start)->startOfDay(),
        Carbon::parse($end)->endOfDay()
    ]);
}

public function scopeByDueDateOrCompletionDate($query, $start, $end)
{
    $startDate = Carbon::parse($start)->startOfDay();
    $endDate = Carbon::parse($end)->endOfDay();
    
    return $query->where(function ($q) use ($startDate, $endDate) {
        $q->whereBetween('due_date', [$startDate, $endDate])
          ->orWhereBetween('actual_completion_date', [$startDate, $endDate]);
    });
}
```

#### MaxSupplyController (`app/Http/Controllers/Api/V1/MaxSupply/MaxSupplyController.php`)
```php
if ($request->filled('date_from') && $request->filled('date_to')) {
    $dateType = $request->input('date_type', 'start_date');
    
    switch ($dateType) {
        case 'completion_date':
            $query->byCompletionDateRange($request->date_from, $request->date_to);
            break;
        case 'created_at':
            $query->byCreatedDateRange($request->date_from, $request->date_to);
            break;
        case 'due_date':
            $query->byDueDateRange($request->date_from, $request->date_to);
            break;
        case 'actual_completion_date':
            $query->byActualCompletionDateRange($request->date_from, $request->date_to);
            break;
        case 'due_or_completion':
            $query->byDueDateOrCompletionDate($request->date_from, $request->date_to);
            break;
        default:
            $query->byDateRange($request->date_from, $request->date_to);
            break;
    }
}
```

### 2. Frontend (React) - เพิ่ม Date Type Selector

#### FilterBar.jsx
```jsx
<Grid item xs={12} md={2}>
  <FormControl fullWidth size="small">
    <InputLabel>ประเภทวันที่</InputLabel>
    <Select
      value={filters.date_type || "start_date"}
      onChange={(e) => onFilterChange("date_type", e.target.value)}
      label="ประเภทวันที่"
    >
      <MenuItem value="start_date">วันที่เริ่มงาน</MenuItem>
      <MenuItem value="completion_date">วันที่คาดว่าจะเสร็จ</MenuItem>
      <MenuItem value="due_date">วันที่ครบกำหนด</MenuItem>
      <MenuItem value="actual_completion_date">วันที่เสร็จจริง</MenuItem>
      <MenuItem value="due_or_completion">ครบกำหนด/เสร็จจริง</MenuItem>
      <MenuItem value="created_at">วันที่สร้าง</MenuItem>
    </Select>
  </FormControl>
</Grid>
```

#### MaxSupplyList.jsx
```javascript
// เพิ่ม date_type ใน default filters
const [filters, setFilters] = useState({
  search: "",
  status: "all", 
  production_type: "all",
  priority: "all",
  date_type: "start_date",  // ✅ เพิ่มใหม่
  date_from: "",
  date_to: "",
  overdue_only: false,
  urgent_only: false,
});
```

## 🎯 API Parameters ที่รองรับ

### การกรองวันที่
```javascript
// API Request Parameters
{
  date_from: "2025-01-01",     // วันที่เริ่มต้น
  date_to: "2025-01-31",       // วันที่สิ้นสุด  
  date_type: "due_date"        // ประเภทวันที่ที่จะกรอง
}
```

### ตัวอย่างการใช้งาน

#### 1. กรองงานที่ครบกำหนดในสัปดาห์นี้
```javascript
const params = {
  date_from: "2025-07-14",
  date_to: "2025-07-20",
  date_type: "due_date"
};
```

#### 2. กรองงานที่เสร็จจริงเดือนที่แล้ว
```javascript
const params = {
  date_from: "2025-06-01", 
  date_to: "2025-06-30",
  date_type: "actual_completion_date"
};
```

#### 3. กรองงานที่ครบกำหนดหรือเสร็จจริงในช่วงที่กำหนด
```javascript
const params = {
  date_from: "2025-07-01",
  date_to: "2025-07-31", 
  date_type: "due_or_completion"  // ✅ ใหม่!
};
```

## 🔍 วิธีทดสอบ

### 1. ทดสอบ UI
1. เลือก "ประเภทวันที่" จาก dropdown
2. กำหนดช่วงวันที่
3. ดูผลลัพธ์ที่กรองออกมา

### 2. ตรวจสอบ Console Logs
```javascript
// Console output ตัวอย่าง
Filter changed: date_type = due_date
Filter changed: date_from = 2025-07-14  
Filter changed: date_to = 2025-07-20
Filter params being sent to API: {
  page: 1,
  per_page: 10,
  date_from: "2025-07-14",
  date_to: "2025-07-20", 
  date_type: "due_date"
}
```

### 3. ตรวจสอบ Network Request
```
GET /api/v1/max-supplies?page=1&per_page=10&date_from=2025-07-14&date_to=2025-07-20&date_type=due_date
```

## 🚀 ประโยชน์ที่ได้

### ✅ ความยืดหยุ่นในการกรอง
- กรองตามวันที่ประเภทต่างๆ ได้
- เลือกกรองแบบรวม (due_or_completion) ได้

### ✅ การใช้งานที่ง่าย  
- UI เป็นมิตรกับผู้ใช้
- มี dropdown เลือกประเภทวันที่ที่ชัดเจน

### ✅ ประสิทธิภาพ
- ใช้ Carbon::parse() + startOfDay/endOfDay
- Query ที่เหมาะสมกับแต่ละประเภทวันที่

### ✅ Debug ง่าย
- มี console logs ครบถ้วน  
- สามารถติดตามการทำงานได้

## 📋 Use Cases ตัวอย่าง

1. **รายงานงานที่ครบกำหนดในสัปดาห์นี้**
   - `date_type: "due_date"` + วันที่ในสัปดาห์

2. **รายงานงานที่เสร็จจริงเดือนที่แล้ว**
   - `date_type: "actual_completion_date"` + วันที่เดือนที่แล้ว

3. **ดูภาพรวมงานที่ครบกำหนดหรือเสร็จแล้วในเดือนนี้**
   - `date_type: "due_or_completion"` + วันที่เดือนนี้

4. **วิเคราะห์งานที่สร้างขึ้นในไตรมาสนี้**
   - `date_type: "created_at"` + วันที่ไตรมาสนี้
