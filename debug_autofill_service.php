<?php

/**
 * Debug AutofillService::getCompletedPricingRequests method
 */

require_once 'tnp-backend/vendor/autoload.php';

// เรียกใช้ Laravel Bootstrap  
$app = require_once 'tnp-backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\Accounting\AutofillService;
use App\Models\PricingRequest;

echo "🔍 Testing AutofillService::getCompletedPricingRequests\n";
echo "==========================================\n\n";

try {
    $autofillService = new AutofillService();
    
    // Test 1: เรียกใช้ method โดยตรง (ไม่มี filters)
    echo "1️⃣ Testing without filters:\n";
    $result = $autofillService->getCompletedPricingRequests([], 10);
    
    echo "Data count: " . count($result['data']) . "\n";
    echo "Pagination total: " . ($result['pagination']['total'] ?? 'N/A') . "\n";
    
    if (!empty($result['data'])) {
        echo "Sample record:\n";
        echo json_encode($result['data'][0], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    }
    echo "\n";

    // Test 2: ทดสอบ query ด้วย status โดยตรง
    echo "2️⃣ Testing direct query:\n";
    
    $directQuery = PricingRequest::with(['pricingCustomer', 'pricingStatus'])
        ->where('pr_is_deleted', 0)
        ->where('pr_status_id', '20db8be1-092b-11f0-b223-38ca84abdf0a')
        ->orderBy('pr_updated_date', 'DESC')
        ->limit(5)
        ->get();
    
    echo "Direct query count: " . $directQuery->count() . "\n";
    
    if ($directQuery->count() > 0) {
        echo "Sample direct record:\n";
        $sample = $directQuery->first();
        echo "  PR ID: {$sample->pr_id}\n";
        echo "  Work Name: {$sample->pr_work_name}\n";
        echo "  Customer Company: " . ($sample->pricingCustomer->cus_company ?? 'N/A') . "\n";
        echo "  Status: " . ($sample->pricingStatus->status_name ?? 'N/A') . "\n";
        echo "  Created: {$sample->pr_created_date}\n";
        echo "  Updated: {$sample->pr_updated_date}\n";
    }
    echo "\n";

    // Test 3: ทดสอบการ Transform
    echo "3️⃣ Testing data transformation:\n";
    if ($directQuery->count() > 0) {
        $sample = $directQuery->first();
        $transformed = [
            'pr_id' => $sample->pr_id,
            'pr_work_name' => $sample->pr_work_name,
            'pr_cus_id' => $sample->pr_cus_id,
            'pr_pattern' => $sample->pr_pattern,
            'pr_fabric_type' => $sample->pr_fabric_type,
            'pr_color' => $sample->pr_color,
            'pr_sizes' => $sample->pr_sizes,
            'pr_quantity' => $sample->pr_quantity,
            'pr_due_date' => $sample->pr_due_date ? $sample->pr_due_date->format('Y-m-d') : null,
            'pr_status' => $sample->pricingStatus->status_name ?? 'Unknown',
            'pr_completed_at' => $sample->pr_updated_date ? $sample->pr_updated_date->format('Y-m-d\TH:i:s\Z') : null,
            'customer' => [
                'cus_id' => $sample->pricingCustomer->cus_id ?? null,
                'cus_company' => $sample->pricingCustomer->cus_company ?? '',
                'cus_tax_id' => $sample->pricingCustomer->cus_tax_id ?? '',
                'cus_address' => $sample->pricingCustomer->cus_address ?? '',
                'cus_zip_code' => $sample->pricingCustomer->cus_zip_code ?? '',
                'cus_tel_1' => $sample->pricingCustomer->cus_tel_1 ?? '',
                'cus_email' => $sample->pricingCustomer->cus_email ?? '',
                'cus_firstname' => $sample->pricingCustomer->cus_firstname ?? '',
                'cus_lastname' => $sample->pricingCustomer->cus_lastname ?? ''
            ]
        ];
        
        echo "Transformed data:\n";
        echo json_encode($transformed, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n🏁 Debug completed!\n";
