# 🎨 MaxSupply System - Pages Design (Simplified Version)

# backend อ่านโค๊ดทั้งหมดก่อนเพราะ โปรเจคนี้มีระบบ Worksheet อยู่แล้ว และ Usermanagement อยู่แล้ว
# 🔧 MaxSupply Backend Design (Laravel 10)

## 🎯 Overview
ออกแบบ Backend สำหรับระบบ MaxSupply โดยใช้ **Laravel 10 + MySQL** รองรับ Frontend ที่ใช้ React 18 + Material UI พร้อมความสามารถ Auto-fill จาก Worksheet และ API ที่เหมาะสำหรับ Mobile

**🎯 Core Principles:**
- **RESTful API** สำหรับ Frontend
- **Auto-fill Integration** จาก Worksheet
- **Database Schema** คำนึงถึงการขยายตัวและใช้งานต่อยอด
- **Mobile-Optimized Responses** ขนาดเล็ก รวดเร็ว
- **Production Type Support** Screen, DTF, Sublimation

---

## 🗃️ 1. Database Schema

### 📊 **Core Tables**

#### **max_supplies** (งานผลิตหลัก)
```sql
CREATE TABLE max_supplies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL, -- MS-001, MS-002
    worksheet_id BIGINT NOT NULL,
    worksheet_item_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    production_type ENUM('screen', 'dtf', 'sublimation') NOT NULL,
    
    -- วันที่
    start_date DATE NOT NULL,
    expected_completion_date DATE NOT NULL,
    due_date DATE NOT NULL,
    actual_completion_date DATE NULL,
    
    -- สถานะ
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    
    -- ข้อมูลการผลิต
    shirt_type ENUM('polo', 't-shirt', 'hoodie', 'tank-top') NOT NULL,
    total_quantity INT NOT NULL,
    completed_quantity INT DEFAULT 0,
    sizes JSON NOT NULL, -- {"S": 50, "M": 150, "L": 200, "XL": 100}
    
    -- จุดพิมพ์แยกตามประเภท
    screen_points INT DEFAULT 0,
    dtf_points INT DEFAULT 0,
    sublimation_points INT DEFAULT 0,
    
    -- หมายเหตุ
    notes TEXT NULL,
    special_instructions TEXT NULL,
    

    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (worksheet_id) REFERENCES worksheets(id) ON DELETE CASCADE,
    FOREIGN KEY (worksheet_item_id) REFERENCES worksheet_items(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    
    INDEX idx_code (code),
    INDEX idx_worksheet_id (worksheet_id),
    INDEX idx_production_type (production_type),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_due_date (due_date),
    INDEX idx_created_by (created_by)
);
```


## 🛠️ 2. API Endpoints


### 🏭 **Production Jobs (MaxSupply)**
```
GET    /api/max-supplies                    # รายการงานทั้งหมด 
POST   /api/max-supplies                    # สร้างงานใหม่
GET    /api/max-supplies/{id}               # รายละเอียดงาน
PUT    /api/max-supplies/{id}               # แก้ไขงาน
DELETE /api/max-supplies/{id}               # ลบงาน
PATCH  /api/max-supplies/{id}/status        # เปลี่ยนสถานะ
```

### 📅 **Calendar**
```
GET    /api/calendar                        # ข้อมูลปฏิทิน
GET    /api/calendar/{year}/{month}         # ข้อมูลรายเดือน
GET    /api/calendar/week/{date}            # ข้อมูลรายสัปดาห์
```

### 📊 **Statistics**
```
GET    /api/statistics/dashboard            # ข้อมูลสถิติหน้าหลัก
GET    /api/statistics/production-types     # สถิติตามประเภทงาน
GET    /api/statistics/monthly/{year}/{month} # สถิติรายเดือน
```

### 📱 **Mobile Specific**
```
GET    /api/mobile/summary                  # ข้อมูลสรุปสำหรับมือถือ
GET    /api/mobile/recent-activities        # กิจกรรมล่าสุด
GET    /api/mobile/quick-actions            # ปุ่มลัด
```

---

## 🏗️ 3. Laravel Structure

### 📁 **Directory Structure**
```
app/
├── Http/
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── WorksheetController.php
│   │   ├── MaxSupplyController.php
│   │   ├── CalendarController.php
│   │   └── StatisticsController.php
│   ├── Requests/
│   │   ├── StoreMaxSupplyRequest.php
│   │   ├── UpdateMaxSupplyRequest.php
│   │   └── StatusUpdateRequest.php
│   ├── Resources/
│   │   ├── WorksheetResource.php
│   │   ├── MaxSupplyResource.php
│   │   ├── CalendarResource.php
│   │   └── MobileResource.php
│   └── Middleware/
│       └── EnsureApiResponse.php
├── Models/
│   ├── User.php
│   ├── Worksheet.php
│   ├── WorksheetItem.php
│   ├── MaxSupply.php
│   └── ActivityLog.php
├── Services/
│   ├── WorksheetService.php
│   ├── MaxSupplyService.php
│   ├── CalendarService.php
│   └── StatisticsService.php
├── Enums/
│   ├── ProductionType.php
│   ├── Status.php
│   └── Priority.php
└── Observers/
    └── MaxSupplyObserver.php
```

---

## 🎯 4. Core Models

### 📄 **MaxSupply Model**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaxSupply extends Model
{
    protected $fillable = [
        'code',
        'worksheet_id',
        'worksheet_item_id',
        'title',
        'customer_name',
        'production_type',
        'start_date',
        'expected_completion_date',
        'due_date',
        'status',
        'priority',
        'shirt_type',
        'total_quantity',
        'completed_quantity',
        'sizes',
        'screen_points',
        'dtf_points',
        'sublimation_points',
        'notes',
        'special_instructions',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'sizes' => 'array',
        'start_date' => 'date',
        'expected_completion_date' => 'date',
        'due_date' => 'date',
        'actual_completion_date' => 'date',
    ];

    // Relationships
    public function worksheet(): BelongsTo
    {
        return $this->belongsTo(Worksheet::class);
    }

    public function worksheetItem(): BelongsTo
    {
        return $this->belongsTo(WorksheetItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    // Scopes
    public function scopeByProductionType($query, $type)
    {
        return $query->where('production_type', $type);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByDateRange($query, $start, $end)
    {
        return $query->whereBetween('start_date', [$start, $end]);
    }

    // Accessors
    public function getProgressPercentageAttribute()
    {
        if ($this->total_quantity == 0) return 0;
        return round(($this->completed_quantity / $this->total_quantity) * 100, 2);
    }

    public function getIsOverdueAttribute()
    {
        return $this->due_date < now() && $this->status !== 'completed';
    }

    public function getDurationDaysAttribute()
    {
        return $this->start_date->diffInDays($this->expected_completion_date);
    }
}
```


## 🎛️ 5. Controllers

### 📋 **MaxSupplyController**
```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMaxSupplyRequest;
use App\Http\Requests\UpdateMaxSupplyRequest;
use App\Http\Resources\MaxSupplyResource;
use App\Models\MaxSupply;
use App\Services\MaxSupplyService;
use Illuminate\Http\Request;

class MaxSupplyController extends Controller
{
    public function __construct(
        private MaxSupplyService $maxSupplyService
    ) {}

    /**
     * รายการงานทั้งหมด
     */
    public function index(Request $request)
    {
        $query = MaxSupply::with(['worksheet', 'creator'])
            ->orderBy('created_at', 'desc');

        // Filters
        if ($request->filled('production_type')) {
            $query->byProductionType($request->production_type);
        }

        if ($request->filled('status')) {
            $query->byStatus($request->status);
        }

        if ($request->filled('search')) {
            $query->where('title', 'like', "%{$request->search}%")
                  ->orWhere('customer_name', 'like', "%{$request->search}%");
        }

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->byDateRange($request->date_from, $request->date_to);
        }

        $maxSupplies = $query->paginate(20);

        return MaxSupplyResource::collection($maxSupplies);
    }

    /**
     * สร้างงานใหม่
     */
    public function store(StoreMaxSupplyRequest $request)
    {
        $maxSupply = $this->maxSupplyService->create($request->validated());

        return new MaxSupplyResource($maxSupply);
    }

    /**
     * รายละเอียดงาน
     */
    public function show(MaxSupply $maxSupply)
    {
        $maxSupply->load(['worksheet', 'worksheetItem', 'creator', 'activities.user']);

        return new MaxSupplyResource($maxSupply);
    }

    /**
     * แก้ไขงาน
     */
    public function update(UpdateMaxSupplyRequest $request, MaxSupply $maxSupply)
    {
        $maxSupply = $this->maxSupplyService->update($maxSupply, $request->validated());

        return new MaxSupplyResource($maxSupply);
    }

    /**
     * ลบงาน
     */
    public function destroy(MaxSupply $maxSupply)
    {
        $this->maxSupplyService->delete($maxSupply);

        return response()->json(['message' => 'งานถูกลบเรียบร้อยแล้ว']);
    }

    /**
     * เปลี่ยนสถานะงาน
     */
    public function updateStatus(Request $request, MaxSupply $maxSupply)
    {
        $request->validate([
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'completed_quantity' => 'nullable|integer|min:0|max:' . $maxSupply->total_quantity,
        ]);

        $maxSupply = $this->maxSupplyService->updateStatus(
            $maxSupply,
            $request->status,
            $request->completed_quantity
        );

        return new MaxSupplyResource($maxSupply);
    }
}
```

### 📅 **CalendarController**
```php
<?php

namespace App\Http\Controllers;

use App\Http\Resources\CalendarResource;
use App\Services\CalendarService;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    public function __construct(
        private CalendarService $calendarService
    ) {}

    /**
     * ข้อมูลปฏิทิน
     */
    public function index(Request $request)
    {
        $view = $request->get('view', 'month'); // month, week, day
        $date = $request->get('date', now()->format('Y-m-d'));

        $data = $this->calendarService->getCalendarData($view, $date);

        return new CalendarResource($data);
    }

    /**
     * ข้อมูลรายเดือน
     */
    public function monthlyData(int $year, int $month)
    {
        $data = $this->calendarService->getMonthlyData($year, $month);

        return response()->json($data);
    }

    /**
     * ข้อมูลรายสัปดาห์
     */
    public function weeklyData(string $date)
    {
        $data = $this->calendarService->getWeeklyData($date);

        return response()->json($data);
    }
}
```


---

## 🔧 6. Services

### 🏭 **MaxSupplyService**
```php
<?php

namespace App\Services;

use App\Models\MaxSupply;
use App\Models\Worksheet;
use App\Models\WorksheetItem;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;

class MaxSupplyService
{
    /**
     * สร้างงานใหม่
     */
    public function create(array $data): MaxSupply
    {
        return DB::transaction(function () use ($data) {
            // Auto-fill จาก worksheet
            $worksheet = Worksheet::findOrFail($data['worksheet_id']);
            $worksheetItem = WorksheetItem::findOrFail($data['worksheet_item_id']);

            $maxSupply = MaxSupply::create([
                'code' => $this->generateCode(),
                'worksheet_id' => $data['worksheet_id'],
                'worksheet_item_id' => $data['worksheet_item_id'],
                'title' => $data['title'] ?? $worksheetItem->product_name,
                'customer_name' => $worksheet->customer_name,
                'production_type' => $worksheetItem->print_type,
                'start_date' => $data['start_date'] ?? now(),
                'expected_completion_date' => $data['expected_completion_date'],
                'due_date' => $worksheet->due_date,
                'shirt_type' => $worksheetItem->shirt_type,
                'total_quantity' => $worksheetItem->quantity,
                'sizes' => $worksheetItem->sizes,
                'screen_points' => $this->calculatePoints($worksheetItem, 'screen'),
                'dtf_points' => $this->calculatePoints($worksheetItem, 'dtf'),
                'sublimation_points' => $this->calculatePoints($worksheetItem, 'sublimation'),
                'notes' => $data['notes'] ?? null,
                'special_instructions' => $data['special_instructions'] ?? $worksheetItem->special_instructions,
                'created_by' => auth()->id(),
            ]);

            // Log activity
            $this->logActivity($maxSupply, 'created', 'สร้างงานใหม่');

            return $maxSupply;
        });
    }

    /**
     * แก้ไขงาน
     */
    public function update(MaxSupply $maxSupply, array $data): MaxSupply
    {
        return DB::transaction(function () use ($maxSupply, $data) {
            $oldValues = $maxSupply->toArray();

            $maxSupply->update(array_merge($data, [
                'updated_by' => auth()->id(),
            ]));

            // Log activity
            $this->logActivity($maxSupply, 'updated', 'แก้ไขข้อมูลงาน', $oldValues, $data);

            return $maxSupply;
        });
    }

    /**
     * เปลี่ยนสถานะ
     */
    public function updateStatus(MaxSupply $maxSupply, string $status, ?int $completedQuantity = null): MaxSupply
    {
        return DB::transaction(function () use ($maxSupply, $status, $completedQuantity) {
            $oldStatus = $maxSupply->status;

            $updateData = [
                'status' => $status,
                'updated_by' => auth()->id(),
            ];

            if ($completedQuantity !== null) {
                $updateData['completed_quantity'] = $completedQuantity;
            }

            if ($status === 'completed') {
                $updateData['actual_completion_date'] = now();
                $updateData['completed_quantity'] = $maxSupply->total_quantity;
            }

            $maxSupply->update($updateData);

            // Log activity
            $this->logActivity($maxSupply, 'status_changed', "เปลี่ยนสถานะจาก {$oldStatus} เป็น {$status}");

            return $maxSupply;
        });
    }

    /**
     * ลบงาน
     */
    public function delete(MaxSupply $maxSupply): void
    {
        DB::transaction(function () use ($maxSupply) {
            $this->logActivity($maxSupply, 'deleted', 'ลบงาน');
            $maxSupply->delete();
        });
    }

    /**
     * สร้างรหัสงาน
     */
    private function generateCode(): string
    {
        $today = now()->format('Ymd');
        $count = MaxSupply::whereDate('created_at', now())->count() + 1;
        
        return "MS-{$today}-" . str_pad($count, 3, '0', STR_PAD_LEFT);
    }

    /**
     * คำนวณจุดพิมพ์
     */
    private function calculatePoints(WorksheetItem $item, string $type): int
    {
        if ($item->print_type !== $type) {
            return 0;
        }

        $basePoints = match($type) {
            'screen' => 2,
            'dtf' => 1,
            'sublimation' => 3,
            default => 1
        };

        $sizeCount = count($item->sizes ?? []);
        $colorCount = count($item->colors ?? []);

        return $basePoints * $sizeCount * $colorCount;
    }

    /**
     * บันทึก activity log
     */
    private function logActivity(MaxSupply $maxSupply, string $action, string $description, ?array $oldValues = null, ?array $newValues = null): void
    {
        ActivityLog::create([
            'max_supply_id' => $maxSupply->id,
            'user_id' => auth()->id(),
            'action' => $action,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);
    }
}
```

### 📅 **CalendarService**
```php
<?php

namespace App\Services;

use App\Models\MaxSupply;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CalendarService
{
    /**
     * ข้อมูลปฏิทิน
     */
    public function getCalendarData(string $view, string $date): array
    {
        $startDate = Carbon::parse($date);
        
        return match($view) {
            'month' => $this->getMonthlyData($startDate->year, $startDate->month),
            'week' => $this->getWeeklyData($date),
            'day' => $this->getDailyData($date),
            default => $this->getMonthlyData($startDate->year, $startDate->month)
        };
    }

    /**
     * ข้อมูลรายเดือน
     */
    public function getMonthlyData(int $year, int $month): array
    {
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $maxSupplies = MaxSupply::with(['worksheet', 'creator'])
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('start_date', [$startDate, $endDate])
                      ->orWhereBetween('expected_completion_date', [$startDate, $endDate])
                      ->orWhere(function ($q) use ($startDate, $endDate) {
                          $q->where('start_date', '<=', $startDate)
                            ->where('expected_completion_date', '>=', $endDate);
                      });
            })
            ->orderBy('start_date')
            ->get();

        // จัดกลุ่มงานตามวัน
        $events = [];
        $statistics = [
            'weekly_stats' => [],
            'monthly_total' => [
                'screen' => 0,
                'dtf' => 0,
                'sublimation' => 0,
                'revenue' => 0,
                'hours' => 0
            ]
        ];

        foreach ($maxSupplies as $maxSupply) {
            $events[] = [
                'id' => $maxSupply->id,
                'code' => $maxSupply->code,
                'title' => $maxSupply->title,
                'production_type' => $maxSupply->production_type,
                'status' => $maxSupply->status,
                'start_date' => $maxSupply->start_date->format('Y-m-d'),
                'end_date' => $maxSupply->expected_completion_date->format('Y-m-d'),
                'creator' => $maxSupply->creator->name,
                'customer' => $maxSupply->customer_name,
                'quantity' => $maxSupply->total_quantity,
                'progress' => $maxSupply->progress_percentage,
                'is_overdue' => $maxSupply->is_overdue,
            ];

            // คำนวณสถิติ
            $statistics['monthly_total'][$maxSupply->production_type]++;
            $statistics['monthly_total']['hours'] += $maxSupply->duration_days * 8; // สมมุติ 8 ชม./วัน
        }

        // คำนวณสถิติรายสัปดาห์
        $statistics['weekly_stats'] = $this->calculateWeeklyStats($maxSupplies, $startDate, $endDate);

        return [
            'year' => $year,
            'month' => $month,
            'events' => $events,
            'statistics' => $statistics,
            'calendar_grid' => $this->generateCalendarGrid($year, $month, $events)
        ];
    }

    /**
     * ข้อมูลรายสัปดาห์
     */
    public function getWeeklyData(string $date): array
    {
        $startDate = Carbon::parse($date)->startOfWeek();
        $endDate = $startDate->copy()->endOfWeek();

        $maxSupplies = MaxSupply::with(['worksheet', 'creator'])
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('start_date', [$startDate, $endDate])
                      ->orWhereBetween('expected_completion_date', [$startDate, $endDate])
                      ->orWhere(function ($q) use ($startDate, $endDate) {
                          $q->where('start_date', '<=', $startDate)
                            ->where('expected_completion_date', '>=', $endDate);
                      });
            })
            ->orderBy('start_date')
            ->get();

        $timeline = [];
        $timeSlots = ['09:00-12:00', '13:00-16:00', '17:00-20:00'];

        for ($i = 0; $i < 7; $i++) {
            $currentDate = $startDate->copy()->addDays($i);
            $dayEvents = $maxSupplies->filter(function ($item) use ($currentDate) {
                return $currentDate->between($item->start_date, $item->expected_completion_date);
            });

            $timeline[$currentDate->format('Y-m-d')] = [
                'date' => $currentDate->format('Y-m-d'),
                'day_name' => $currentDate->format('l'),
                'events' => $dayEvents->values()->toArray(),
                'time_slots' => $this->distributeEventsToTimeSlots($dayEvents, $timeSlots)
            ];
        }

        return [
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'timeline' => $timeline,
            'statistics' => $this->calculatePeriodStats($maxSupplies)
        ];
    }

    /**
     * ข้อมูลรายวัน
     */
    public function getDailyData(string $date): array
    {
        $targetDate = Carbon::parse($date);

        $maxSupplies = MaxSupply::with(['worksheet', 'creator'])
            ->where(function ($query) use ($targetDate) {
                $query->where('start_date', '<=', $targetDate)
                      ->where('expected_completion_date', '>=', $targetDate);
            })
            ->orderBy('start_date')
            ->get();

        $events = [];
        $timeSlots = [
            '09:00-12:00' => [],
            '13:00-16:00' => [],
            '17:00-20:00' => []
        ];

        foreach ($maxSupplies as $maxSupply) {
            $event = [
                'id' => $maxSupply->id,
                'code' => $maxSupply->code,
                'title' => $maxSupply->title,
                'production_type' => $maxSupply->production_type,
                'status' => $maxSupply->status,
                'customer' => $maxSupply->customer_name,
                'progress' => $maxSupply->progress_percentage,
                'creator' => $maxSupply->creator->name,
            ];

            $events[] = $event;

            // แจกจ่ายงานไปยัง time slots
            $slotIndex = $maxSupply->id % 3;
            $slot = array_keys($timeSlots)[$slotIndex];
            $timeSlots[$slot][] = $event;
        }

        return [
            'date' => $targetDate->format('Y-m-d'),
            'events' => $events,
            'time_slots' => $timeSlots,
            'statistics' => $this->calculatePeriodStats($maxSupplies)
        ];
    }

    /**
     * คำนวณสถิติรายสัปดาห์
     */
    private function calculateWeeklyStats(Collection $maxSupplies, Carbon $startDate, Carbon $endDate): array
    {
        $weeks = [];
        $current = $startDate->copy();

        while ($current <= $endDate) {
            $weekStart = $current->copy()->startOfWeek();
            $weekEnd = $current->copy()->endOfWeek();

            $weekEvents = $maxSupplies->filter(function ($item) use ($weekStart, $weekEnd) {
                return $item->start_date->between($weekStart, $weekEnd) ||
                       $item->expected_completion_date->between($weekStart, $weekEnd);
            });

            $weeks[] = [
                'week' => $current->weekOfMonth,
                'screen' => $weekEvents->where('production_type', 'screen')->count(),
                'dtf' => $weekEvents->where('production_type', 'dtf')->count(),
                'sublimation' => $weekEvents->where('production_type', 'sublimation')->count(),
            ];

            $current->addWeek();
        }

        return $weeks;
    }

    /**
     * คำนวณสถิติรายช่วงเวลา
     */
    private function calculatePeriodStats(Collection $maxSupplies): array
    {
        return [
            'total_jobs' => $maxSupplies->count(),
            'by_type' => [
                'screen' => $maxSupplies->where('production_type', 'screen')->count(),
                'dtf' => $maxSupplies->where('production_type', 'dtf')->count(),
                'sublimation' => $maxSupplies->where('production_type', 'sublimation')->count(),
            ],
            'by_status' => [
                'pending' => $maxSupplies->where('status', 'pending')->count(),
                'in_progress' => $maxSupplies->where('status', 'in_progress')->count(),
                'completed' => $maxSupplies->where('status', 'completed')->count(),
                'cancelled' => $maxSupplies->where('status', 'cancelled')->count(),
            ]
        ];
    }

    /**
     * สร้าง calendar grid
     */
    private function generateCalendarGrid(int $year, int $month, array $events): array
    {
        $startDate = Carbon::createFromDate($year, $month, 1);
        $endDate = $startDate->copy()->endOfMonth();
        $grid = [];

        // จัดกลุ่ม events ตามวัน
        $eventsByDate = [];
        foreach ($events as $event) {
            $start = Carbon::parse($event['start_date']);
            $end = Carbon::parse($event['end_date']);
            
            for ($date = $start; $date <= $end; $date->addDay()) {
                $dateKey = $date->format('Y-m-d');
                if (!isset($eventsByDate[$dateKey])) {
                    $eventsByDate[$dateKey] = [];
                }
                $eventsByDate[$dateKey][] = $event;
            }
        }

        // สร้าง grid
        for ($day = 1; $day <= $endDate->day; $day++) {
            $currentDate = Carbon::createFromDate($year, $month, $day);
            $dateKey = $currentDate->format('Y-m-d');
            
            $grid[$day] = [
                'date' => $dateKey,
                'day' => $day,
                'events' => $eventsByDate[$dateKey] ?? [],
                'is_weekend' => $currentDate->isWeekend(),
                'is_today' => $currentDate->isToday(),
            ];
        }

        return $grid;
    }

    /**
     * แจกจ่ายงานไปยัง time slots
     */
    private function distributeEventsToTimeSlots(Collection $events, array $timeSlots): array
    {
        $slots = [];
        foreach ($timeSlots as $slot) {
            $slots[$slot] = [];
        }

        foreach ($events as $index => $event) {
            $slotIndex = $index % count($timeSlots);
            $slot = $timeSlots[$slotIndex];
            $slots[$slot][] = $event;
        }

        return $slots;
    }
}
```

## 🔧 7. API Routes

### 📄 **routes/api.php**
```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\MaxSupplyController;
use App\Http\Controllers\CalendarController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/



// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    


    // Max Supplies (Production Jobs)
    Route::prefix('max-supplies')->group(function () {
        Route::get('/', [MaxSupplyController::class, 'index']);
        Route::post('/', [MaxSupplyController::class, 'store']);
        Route::get('/{maxSupply}', [MaxSupplyController::class, 'show']);
        Route::put('/{maxSupply}', [MaxSupplyController::class, 'update']);
        Route::delete('/{maxSupply}', [MaxSupplyController::class, 'destroy']);
        Route::patch('/{maxSupply}/status', [MaxSupplyController::class, 'updateStatus']);
    });

    // Calendar
    Route::prefix('calendar')->group(function () {
        Route::get('/', [CalendarController::class, 'index']);
        Route::get('/{year}/{month}', [CalendarController::class, 'monthlyData']);
        Route::get('/week/{date}', [CalendarController::class, 'weeklyData']);
    });




```

---


## 🎨 9. Key Features

### ✅ **Auto-fill จาก Worksheet**
- ข้อมูลลูกค้า, ประเภทงาน, ขนาด, จำนวนจุดพิมพ์
- คำนวณจุดพิมพ์ตามประเภท Screen/DTF/Sublimation
- ตั้งวันที่และกำหนดเวลาอัตโนมัติ

### 📱 **Mobile-First API Design**
- Response ขนาดเล็ก, โหลดเร็ว
- Pagination และ filtering
- Error handling ที่ชัดเจน

### 🎯 **Production Type Support**
- Screen: จุดพิมพ์ x2, เวลา 3-6 ชม.
- DTF: จุดพิมพ์ x1, เวลา 1-2 ชม.
- Sublimation: จุดพิมพ์ x3, เวลา 2-4 ชม.

### 📊 **Calendar Integration**
- Monthly, Weekly, Daily views
- Timeline visualization
- Multi-job overlapping support
- Statistics และ analytics

---






# frontend
## 📱 Overview
ออกแบบหน้าเว็บสำหรับระบบ MaxSupply โดยใช้ **React 18 + react-icons + Material UI** 
รองรับการใช้งานทั้ง Desktop และ Mobile แบบ Responsive Design ทันสมัย การกรอกข้อมูลบนมือถือที่ใช้งานง่าย และการแสดงผลที่ชัดเจน

**🎯 Core Features:**
- Calendar สำหรับดูภาพรวมงานผลิต
- Form กรอกข้อมูลที่ Auto fill จาก Worksheet
- ระบบง่ายๆ ใช้งานได้ทันที

---

## 🏠 1. Homepage

### 🎯 วัตถุประสงค์
หน้าแรกที่แสดงภาพรวมของงานผลิตทั้งหมด เป็นงานที่แสดงคล้ายกับ Google Calendar โดยมีข้อมูลสถิติและกิจกรรมล่าสุด ในแต่ละวันหรือสัปดาห์ หรือเดือน เพื่อให้วิเคราะห์และวางแผนการผลิตได้อย่างมีประสิทธิภาพ แยกกันระหว่าง Screen, DTF และ Sublimation

### 📊 Layout & Components




#### **Calendar-Style Production Timeline**

**📅 มุมมองรายเดือน (เข้ามาเห็นหน้านี้เป็น default):**
```
┌─ กำหนดการผลิตประจำเดือน (กันยายน 2024) ────────────────┐
│ อา  จ   อ   พ   พฤ  ศ   ส  │ สถิติรายสัปดาห์           │
│  1   2   3   4   5   6   7  │ สัปดาห์ 1: 📺15 📱12 ⚽8   │
│ -- ┌📺T001: 2-5┐ ┌📱P002┐ -- │ สัปดาห์ 2: 📺18 📱15 ⚽6   │
│    └─────────┘   └6-7──┘   │                          │
│    ┌📱P003: 3-4┐           │ (งานพร้อมกัน 2-3 งาน/วัน) │
│    └─────────┘             │                          │
│                            │                          │
│  8   9  10  11  12  13  14  │ สัปดาห์ 3: 📺12 📱20 ⚽10  │
│ ┌⚽S003:8-11┐ ┌📱P004:12-14┐│ สัปดาห์ 4: 📺20 📱18 ⚽12  │
│ └──────────┘  └──────────┘  │                          │
│ ┌📺T005: 9-10┐             │                          │
│ └─────────┘               │                          │
│ ┌📱P006: 11┐              │                          │
│ └────────┘                │                          │
│                            │                          │
│ 15  16  17  18  19  20  21  │ 📊 ยอดรวมเดือน:          │
│ ┌📱P005: 15-18┐┌📺T006:19-21┐│ 📺 Screen: 65 งาน (↑12%) │
│ └───────────┘ └──────────┘  │ 📱 DTF: 65 งาน (↑8%)    │
│ ┌⚽S007: 16-19┐             │ ⚽ Sub: 36 งาน (↓5%)     │
│ └────────────┘             │                          │
│                            │                          │
│ 22  23  24  25  26  27  28  │                          │
│ ┌📺T007:22-25┐┌⚽S008:26-28┐│                       │
│ └─────────┘  └──────────┘   │                          │
│ ┌📱P010:23-26┐             │                          │
│ └───────────┘              │                          │
│ ┌📺T011: 25-27┐            │                          │
│ └────────────┘             │                          │
│                            │                          │
│ 29  30                     │ 📈 คลิกงานเพื่อดูรายละเอียด │
│ ┌📱P009: 29-30┐           │                          │
│ └────────────┘            │                          │
│ ┌📺T012: 30┐              │                          │
│ └─────────┘               │                          │
│                            │                          │
│ [< เดือนก่อน] [กันยายน] [เดือนหน้า >] [📈 ดูแนวโน้ม]    │
└────────────────────────────────────────────────────────┘
```

**📅 มุมมองรายสัปดาห์:**
```
┌─ Timeline การผลิต (คล้าย Google Calendar) ─────────────┐
│                จ    อ    พ    พฤ   ศ    ส    อา      │
│ 09:00-12:00 │📺Scr│📱DTF│ -- │⚽Sub│📺Scr│ -- │  -- │
│ 13:00-16:00 │📱DTF│📺Scr│📱DTF│📺Scr│⚽Sub│ -- │  -- │
│ 17:00-20:00 │ -- │⚽Sub│📺Scr│ -- │📱DTF│ -- │  -- │
│                                                      │
│ [< สัปดาห์ก่อน] [สัปดาห์นี้] [สัปดาห์หน้า >]           │
└──────────────────────────────────────────────────────┘
```



#### **Quick Actions**
```
┌─────────────────────────────────────────┐
│ [🆕 สร้างงานใหม่] [📋 ดู Worksheet]      │
│ [📊 รายงาน]                            │
└─────────────────────────────────────────┘
```



### 🎨 Interactive Features
- **Time Period Toggle**: สลับมุมมอง วัน/สัปดาห์/เดือน
- **Production Type Filter**: เลือกดูเฉพาะ Screen/DTF/Sublimation
- **Drag & Drop**: ย้ายงานในไทมไลน์ (ถ้ามีสิทธิ์)
- **Hover Info**: แสดงรายละเอียดงานเมื่อ hover
- **Click to Detail**: คลิกเพื่อดูรายละเอียดงาน

### 📱 Mobile Adaptation
- Stack cards แนวตั้ง
- Collapse stats เป็น carousel
- Bottom navigation ใช้แทน sidebar
- Swipe gestures สำหรับเปลี่ยน time period
- Simplified timeline view สำหรับหน้าจอเล็ก

---

## 📋 2. MaxSupplyList Page

### 🎯 วัตถุประสงค์
แสดงรายการงานผลิตทั้งหมดในรูปแบบตาราง พร้อมฟีเจอร์ค้นหา กรอง และจัดการ

### 📊 Layout & Components

#### **Filter & Search Bar**
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 [ค้นหา...] | 📅 [วันที่] | 📊 [สถานะ] |            │
│ [🔄 รีเฟรช]                                          │
└─────────────────────────────────────────────────────────┘
```

#### **Data Table**
| คอลัมน์ | ความกว้าง | รายละเอียด |
|---------|-----------|-----------|
| **ID** | 80px | MS-001, MS-002 |
| **ชื่องาน** | 200px | ชื่อผลิตภัณฑ์ + รหัส worksheet |
| **ประเภท** | 100px | 📺Screen, 📱DTF, ⚽Sub |
| **สถานะ** | 120px | Badge แสดงสถานะพร้อมสี |
| **ครบกำหนด** | 120px | วันที่ + เวลา |
| **ผู้สร้าง** | 100px | ชื่อผู้ใช้ |
| **Actions** | 120px | ปุ่ม [ดู] [แก้ไข] [ลบ] |

#### **Status Badges**
- 🟡 **รอเริ่ม** (Pending)
- 🔵 **กำลังผลิต** (In Progress)
- 🟢 **เสร็จสิ้น** (Completed)
- 🔴 **ยกเลิก** (Cancelled)

### 🎨 Interactive Features
- **Row Click**: เปิด Detail Modal
- **Bulk Actions**: เลือกหลายรายการเพื่อ Export หรือ Update สถานะ
- **Sort**: คลิกหัวตารางเพื่อเรียงลำดับ

### 📱 Mobile Adaptation
- เปลี่ยนเป็น Card List แทนตาราง
- Sticky search bar
- Infinite scroll แทน pagination

---

## ✏️ 3. MaxSupplyForm Page (Core Feature)

### 🎯 วัตถุประสงค์
ฟอร์มสำหรับสร้างงานใหม่และแก้ไขงานที่มีอยู่ โดยข้อมูลจะ Auto fill จาก Worksheet

### 📊 Layout & Components

#### **Form Structure**
```
┌─ Step 1: ข้อมูลพื้นฐาน ─────────────────────┐
│ • เลือก Worksheet                         │
│ • ชื่องาน          (Auto fill from Worksheet) │
│ • ชื่อลูกค้า         (Auto fill from Worksheet) │
│ • รูปตัวอย่างเสื้อ     (Auto fill from Worksheet) │
│ • วันครบกำหนด      (Auto fill from Worksheet) │
│ • วันที่เริ่ม      (ตั้งเป็นวันที่ปัจจุบัน หรือแก้ไขได้) │
│ • วันที่คาดว่าจะเสร็จ (ถ้าตั้งเกินวันที่ครบกำหนด → แจ้งเตือน) │
└─────────────────────────────────────────────┘

┌─ Step 2: ข้อมูลการผลิต ─────────────────────┐
│ • ประเภทเสื้อ        (Auto fill from Worksheet) │
│ • ขนาด (S, M, L, XL) (เพิ่มได้หลาย row) (Auto fill from Worksheet) │
│ • ประเภทการพิมพ์เสื้อ (Auto fill from Worksheet) │
│ • จุดพิมพ์ (แยกกัน 3 อัน แยกกันคำนวณ) (Auto fill from Worksheet) │
│    └─>   1. 📺 Screen                        │
│    └─>   2. 📱 DTF                          │
│    └─>   3. ⚽ Sublimation                  │
└─────────────────────────────────────────────┘

┌─ Step 3: หมายเหตุ ──────────────────────────┐
│ • Note (ข้อมูลเพิ่มเติม)                    │
│ • Special Instructions                     │
└─────────────────────────────────────────────┘
```

#### **Worksheet Selector**
- **Material UI Autocomplete** เลือก worksheet จากระบบ
- แสดงข้อมูลลูกค้า รายการสินค้า วันที่สั่ง
- **Auto-fill ทั้งหมด** เมื่อเลือก worksheet

#### **Production Type Calculator**
```javascript
// คำนวณงานแต่ละประเภท
const calculateProduction = (worksheet) => {
  const screenJobs = worksheet.items.filter(item => item.printType === 'screen');
  const dtfJobs = worksheet.items.filter(item => item.printType === 'dtf');
  const sublimationJobs = worksheet.items.filter(item => item.printType === 'sublimation');
  
  return {
    screen: screenJobs.length,
    dtf: dtfJobs.length,
    sublimation: sublimationJobs.length
  };
};
```

#### **Size Management**
```
┌─ การจัดการขนาด (Multiple Rows) ─────────────┐
│ Row 1: [S] [M] [L] [XL] - จำนวน: 100 ตัว    │
│ Row 2: [S] [M]         - จำนวน: 50 ตัว     │
│ Row 3: [XL] [XXL]      - จำนวน: 25 ตัว     │
│                                             │
│ [➕ เพิ่มขนาด] [➖ ลบขนาด]                    │
└─────────────────────────────────────────────┘
```

### 🎨 Form Features
- **Real-time Validation**: ตรวจสอบข้อมูลทันทีที่กรอก
- **Smart Defaults**: ตั้งค่าเริ่มต้นอัตโนมัติ
- **Date Validation**: เตือนเมื่อวันที่ไม่สมเหตุสมผล
- **Progress Indicator**: แสดงขั้นตอนการกรอกข้อมูล

### 📱 Mobile Adaptation
- **Stepper Navigation**: แบ่งเป็นขั้นตอนสำหรับมือถือ
- **Touch-friendly Inputs**: ปุ่มและ input ขนาดเหมาะกับนิ้ว
- **Native Date Picker**: ใช้ date picker ของระบบ

---

## 📅 4. MaxSupplyCalendar Page (Core Feature)

### 🎯 วัตถุประสงค์
แสดงงานผลิตในรูปแบบปฏิทิน เพื่อให้เห็นภาพรวมของกำหนดการผลิต

### 📊 Layout & Components

#### **Calendar Header**
```
┌──────────────────────────────────────────────┐
│ [◀ ก.ย. 2024 ▶] [วันนี้] [เดือน|สัปดาห์|วัน] │
│ 🔍 [ค้นหา] 📊 [กรองสถานะ] 📺📱⚽ [ประเภท]    │
└──────────────────────────────────────────────┘
```

#### **Calendar Views**
- **Month View**: แสดงทั้งเดือน (Default)
- **Week View**: แสดงรายสัปดาห์
- **Day View**: แสดงรายวัน

#### **Event Cards on Calendar**
```
┌─ MS-001 ────────────┐
│ 📺 เสื้อโปโล สีขาว    │
│ 🟡 กำลังผลิต        │
│ 👤 พี่โจ             │
│ ⏰ 2-5 ก.ย.         │
└─────────────────────┘
```

#### **Production Type Colors**
- **📺 Screen**: สีม่วง (#7c3aed)
- **📱 DTF**: สีฟ้า (#0891b2)
- **⚽ Sublimation**: สีเขียว (#16a34a)

### 🎨 Interactive Features
- **Click Event**: เปิด Quick View Modal
- **Filter by Type**: เลือกดูประเภทงาน
- **Today Highlight**: เน้นวันปัจจุบัน
- **Multi-task View**: แสดงงานซ้อนทับ

### 📱 Mobile Adaptation
- **Agenda View**: รายการงานสำหรับมือถือ
- **Swipe Navigation**: เลื่อนเปลี่ยนวัน/สัปดาห์
- **Floating Add Button**: สร้างงานใหม่

---

## 📄 5. Worksheet List Page

### 🎯 วัตถุประสงค์
แสดงรายการ worksheet ที่ดึงมาจากระบบ เพื่อเลือกสร้างงานผลิต

### 📊 Layout & Components

#### **Worksheet Cards**
```
┌─ WS-2024-001 ──────────────────────────┐
│ 🏢 ลูกค้า: บริษัท ABC จำกัด              │
│ 📦 ออร์เดอร์: เสื้อโปโล 500 ตัว         │
│ 📅 วันที่สั่ง: 15 ก.ย. 2024             │
│ 🎨 ประเภท: 📺 Screen, 📱 DTF           │
│ ───────────────────────────────────────  │
│ 📊 สถานะ: รอผลิต                      │
│ [📋 ดูรายละเอียด] [✏️ สร้างงานผลิต]    │
└─────────────────────────────────────────┘
```

#### **Auto-fill Preview**
```
┌─ ข้อมูลที่จะ Auto-fill ────────────────────┐
│ ✅ ชื่องาน: "เสื้อโปโล ABC"                │
│ ✅ ลูกค้า: "บริษัท ABC จำกัด"             │
│ ✅ วันครบกำหนด: 25 ก.ย. 2024            │
│ ✅ ประเภท: Screen                       │
│ ✅ ขนาด: S(50), M(150), L(200), XL(100) │
│ ✅ จุดพิมพ์: Screen(2), DTF(1), Sub(0)   │
└─────────────────────────────────────────┘
```

### 📱 Mobile Adaptation
- **Card Layout**: เต็มความกว้าง
- **Pull to Refresh**: ดึงข้อมูลใหม่
- **Quick Actions**: ปุ่มลัดสำหรับการทำงาน

---

## 🎨 6. Design System

### 🎨 Color Palette

#### **Brand Colors**
```
Primary:   #991111 (Deep Red) - ปุ่มหลัก, navigation
Secondary: #e36264 (Coral Red) - hover states, accents
Tertiary:  #fef2f2 (Red-50) - backgrounds
```

#### **Production Type Colors**
```
📺 Screen:      #7c3aed (Violet-600)
📱 DTF:         #0891b2 (Cyan-600)
⚽ Sublimation: #16a34a (Green-600)
```

#### **Status Colors**
```
Success:   #059669 (Emerald-600) - completed
Warning:   #d97706 (Amber-600) - pending
Error:     #dc2626 (Red-600) - overdue
Info:      #2563eb (Blue-600) - scheduled
```

### 📱 Material UI Components
- **Buttons**: Material-UI Button with custom colors
- **Forms**: TextField, Select, DatePicker
- **Cards**: Card, CardContent, CardActions
- **Navigation**: BottomNavigation, Tabs
- **Data Display**: Table, List, Chip

### 🎯 Mobile-First Design
- **Touch Targets**: ขนาดอย่างน้อย 48px
- **Responsive Grid**: Material-UI Grid system
- **Progressive Disclosure**: แสดงข้อมูลเป็นขั้นตอน
- **Gesture Support**: Swipe, Pull-to-refresh

---

## ✅ 7. Implementation Priority

### 🔥 Phase 1: Core Features (MVP)
- [ ] **Calendar View**: Monthly calendar with basic events
- [ ] **Simple Form**: Worksheet selection + Auto-fill
- [ ] **Basic List**: Show all production jobs
- [ ] **Mobile Responsive**: Basic responsive layout

### 🚀 Phase 2: Enhanced Features
- [ ] **Advanced Calendar**: Week/Day views, drag & drop
- [ ] **Smart Form**: Validation, multi-step, size management
- [ ] **Filtering**: Search, filter by type/status
- [ ] **Statistics**: Basic analytics dashboard

### 🌟 Phase 3: Polish & Optimization
- [ ] **Performance**: Lazy loading, caching
- [ ] **UX Improvements**: Animations, feedback
- [ ] **Advanced Features**: Bulk operations, export
- [ ] **Testing**: Unit tests, E2E tests

---

## 🎯 Key Simplifications


### ✅ Simplified Features
- **Auto-fill Everything**: ข้อมูลส่วนใหญ่มาจาก worksheet
- **Three Production Types**: ดึงมาจาก worksheet
- **Essential Forms**: เฉพาะฟิลด์ที่จำเป็น
- **Mobile-First**: ออกแบบสำหรับมือถือก่อน

### 🎨 Technology Stack
- **Frontend**: React 18 + Material-UI + react-icons
- **State Management**: React Context (simple)
- **Forms**: Formik + Yup validation
- **Calendar**: React Big Calendar
- **Charts**: Chart.js (if needed)

---
