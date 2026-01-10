<?php
/**
 * Phase 4.1: Data Verification Script
 * 
 * Purpose: Verify customer data after migration
 * - Check if all existing customers have proper cus_source values
 * - Verify allocation_status is set correctly
 * - List any anomalies or null values
 * 
 * Usage: php database/scripts/check_customer_data_migration.php
 */

require __DIR__ . '/../../vendor/autoload.php';

$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=======================================================\n";
echo "TNP Customer Data Migration Verification (Phase 4.1)\n";
echo "=======================================================\n\n";

// 1. Check total customers
$totalCustomers = DB::table('master_customers')->count();
echo "📊 Total Customers: {$totalCustomers}\n\n";

// 2. Check cus_source distribution
echo "📋 Source Distribution:\n";
echo "------------------------\n";
$sources = DB::table('master_customers')
    ->select('cus_source', DB::raw('COUNT(*) as count'))
    ->groupBy('cus_source')
    ->orderBy('count', 'desc')
    ->get();

foreach ($sources as $source) {
    $percentage = round(($source->count / $totalCustomers) * 100, 2);
    echo sprintf("  %-12s: %5d (%6.2f%%)\n", 
        $source->cus_source ?? 'NULL', 
        $source->count, 
        $percentage
    );
}

// 3. Check allocation_status distribution
echo "\n📋 Allocation Status Distribution:\n";
echo "------------------------------------\n";
$statuses = DB::table('master_customers')
    ->select('cus_allocation_status', DB::raw('COUNT(*) as count'))
    ->groupBy('cus_allocation_status')
    ->orderBy('count', 'desc')
    ->get();

foreach ($statuses as $status) {
    $percentage = round(($status->count / $totalCustomers) * 100, 2);
    echo sprintf("  %-12s: %5d (%6.2f%%)\n", 
        $status->cus_allocation_status ?? 'NULL', 
        $status->count, 
        $percentage
    );
}

// 4. Check for NULL values (should not exist after migration)
echo "\n🔍 Data Quality Check:\n";
echo "----------------------\n";
$nullSources = DB::table('master_customers')
    ->whereNull('cus_source')
    ->count();
echo "  Customers with NULL cus_source: {$nullSources}\n";

$nullStatuses = DB::table('master_customers')
    ->whereNull('cus_allocation_status')
    ->count();
echo "  Customers with NULL cus_allocation_status: {$nullStatuses}\n";

$nullChannels = DB::table('master_customers')
    ->whereNull('cus_channel')
    ->count();
echo "  Customers with NULL cus_channel: {$nullChannels}\n";

// 5. Check customers in pool (should be 0 or only new ones)
echo "\n🏊 Pool Customers (Waiting for Assignment):\n";
echo "--------------------------------------------\n";
$poolCustomers = DB::table('master_customers')
    ->where('cus_allocation_status', 'pool')
    ->count();
echo "  Total in Pool: {$poolCustomers}\n";

if ($poolCustomers > 0) {
    $poolBySource = DB::table('master_customers')
        ->select('cus_source', DB::raw('COUNT(*) as count'))
        ->where('cus_allocation_status', 'pool')
        ->groupBy('cus_source')
        ->get();
    
    echo "  Pool breakdown by source:\n";
    foreach ($poolBySource as $source) {
        echo sprintf("    %-12s: %5d\n", $source->cus_source, $source->count);
    }
}

// 6. Check telesales customers
echo "\n📞 Telesales Customers:\n";
echo "-----------------------\n";
$telesalesTotal = DB::table('master_customers')
    ->where('cus_source', 'telesales')
    ->count();
echo "  Total Telesales: {$telesalesTotal}\n";

$telesalesInPool = DB::table('master_customers')
    ->where('cus_source', 'telesales')
    ->where('cus_allocation_status', 'pool')
    ->count();
echo "  Telesales in Pool: {$telesalesInPool}\n";

$telesalesAllocated = DB::table('master_customers')
    ->where('cus_source', 'telesales')
    ->where('cus_allocation_status', 'allocated')
    ->count();
echo "  Telesales Allocated: {$telesalesAllocated}\n";

// 7. Check for inconsistencies
echo "\n⚠️  Potential Issues:\n";
echo "---------------------\n";

$issues = [];

// Check: Customers in pool should have NULL cus_manage_by
$poolWithManager = DB::table('master_customers')
    ->where('cus_allocation_status', 'pool')
    ->whereNotNull('cus_manage_by')
    ->count();
if ($poolWithManager > 0) {
    $issues[] = "  ⚠️  {$poolWithManager} customers in pool but have cus_manage_by assigned";
}

// Check: Allocated customers should have cus_manage_by (optional, some old data might not have)
$allocatedWithoutManager = DB::table('master_customers')
    ->where('cus_allocation_status', 'allocated')
    ->whereNull('cus_manage_by')
    ->count();
if ($allocatedWithoutManager > 0) {
    $issues[] = "  ℹ️  {$allocatedWithoutManager} allocated customers without cus_manage_by (might be legacy data)";
}

// Check: Telesales customers created before today should be in pool
$oldTelesalesNotInPool = DB::table('master_customers')
    ->where('cus_source', 'telesales')
    ->where('cus_allocation_status', '!=', 'pool')
    ->whereDate('cus_created_date', '<', now()->toDateString())
    ->count();
if ($oldTelesalesNotInPool > 0) {
    $issues[] = "  ℹ️  {$oldTelesalesNotInPool} old telesales customers not in pool (might have been assigned)";
}

if (empty($issues)) {
    echo "  ✅ No issues found!\n";
} else {
    foreach ($issues as $issue) {
        echo $issue . "\n";
    }
}

// 8. Summary
echo "\n=======================================================\n";
echo "✅ Verification Complete\n";
echo "=======================================================\n";

if ($nullSources > 0 || $nullStatuses > 0) {
    echo "\n❌ ACTION REQUIRED: Found NULL values in critical fields!\n";
    echo "Run the following SQL to fix:\n\n";
    if ($nullSources > 0) {
        echo "UPDATE master_customers SET cus_source = 'sales' WHERE cus_source IS NULL;\n";
    }
    if ($nullStatuses > 0) {
        echo "UPDATE master_customers SET cus_allocation_status = 'allocated' WHERE cus_allocation_status IS NULL;\n";
    }
} else {
    echo "\n✅ All data looks good! Migration successful.\n";
}

echo "\n";
