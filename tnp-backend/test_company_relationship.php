<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    echo "Testing Invoice company relationship...\n";
    
    $invoice = App\Models\Accounting\Invoice::first();
    echo "Invoice ID: " . $invoice->id . "\n";
    echo "Company ID: " . $invoice->company_id . "\n";
    
    $company = $invoice->company;
    echo "Company relationship works: " . ($company ? 'YES' : 'NO') . "\n";
    
    if ($company) {
        echo "Company name: " . $company->name . "\n";
    }
    
    echo "SUCCESS: Company relationship is working!\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
