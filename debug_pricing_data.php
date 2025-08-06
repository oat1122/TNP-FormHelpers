<?php

/**
 * Debug script สำหรับตรวจสอบข้อมูล Pricing Request
 */

require_once 'tnp-backend/vendor/autoload.php';

// เรียกใช้ Laravel Bootstrap
$app = require_once 'tnp-backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PricingRequest;
use App\Models\MasterStatus;

echo "🔍 Debugging Pricing Request Data\n";
echo "==========================================\n\n";

// 1. ตรวจสอบจำนวน Pricing Request ทั้งหมด
echo "1️⃣ Total Pricing Requests in database:\n";
$totalPr = PricingRequest::where('pr_is_deleted', 0)->count();
echo "Total: $totalPr records\n\n";

// 2. ตรวจสอบ status ที่มีอยู่
echo "2️⃣ Available Pricing Request Statuses:\n";
$statuses = MasterStatus::select('status_id', 'status_name')->get();
foreach ($statuses as $status) {
    $count = PricingRequest::where('pr_status_id', $status->status_id)
        ->where('pr_is_deleted', 0)
        ->count();
    echo "Status: {$status->status_name} (ID: {$status->status_id}) - Count: $count\n";
}
echo "\n";

// 3. ตรวจสอบ Pricing Request ที่มี status_id = 20db8be1-092b-11f0-b223-38ca84abdf0a
echo "3️⃣ Pricing Requests with target status (20db8be1-092b-11f0-b223-38ca84abdf0a):\n";
$targetStatusCount = PricingRequest::where('pr_status_id', '20db8be1-092b-11f0-b223-38ca84abdf0a')
    ->where('pr_is_deleted', 0)
    ->count();
echo "Count: $targetStatusCount\n";

if ($targetStatusCount > 0) {
    echo "Sample records:\n";
    $samples = PricingRequest::with(['pricingCustomer', 'pricingStatus'])
        ->where('pr_status_id', '20db8be1-092b-11f0-b223-38ca84abdf0a')
        ->where('pr_is_deleted', 0)
        ->limit(3)
        ->get();
    
    foreach ($samples as $sample) {
        echo "  - PR ID: {$sample->pr_id}\n";
        echo "    Work Name: {$sample->pr_work_name}\n";
        echo "    Customer: " . ($sample->pricingCustomer->cus_company ?? 'N/A') . "\n";
        echo "    Status: " . ($sample->pricingStatus->status_name ?? 'N/A') . "\n";
        echo "    Created: {$sample->pr_created_date}\n\n";
    }
}

// 4. ตรวจสอบ Pricing Request ล่าสุด 5 รายการ
echo "4️⃣ Latest 5 Pricing Requests (any status):\n";
$latestPr = PricingRequest::with(['pricingCustomer', 'pricingStatus'])
    ->where('pr_is_deleted', 0)
    ->orderBy('pr_created_date', 'DESC')
    ->limit(5)
    ->get();

foreach ($latestPr as $pr) {
    echo "  - PR ID: {$pr->pr_id}\n";
    echo "    Work Name: {$pr->pr_work_name}\n";
    echo "    Customer: " . ($pr->pricingCustomer->cus_company ?? 'N/A') . "\n";
    echo "    Status: " . ($pr->pricingStatus->status_name ?? 'N/A') . " (ID: {$pr->pr_status_id})\n";
    echo "    Created: {$pr->pr_created_date}\n\n";
}

echo "🏁 Debug completed!\n";
