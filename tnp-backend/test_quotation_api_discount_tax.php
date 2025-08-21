<?php
require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\Api\V1\Accounting\QuotationController;
use App\Services\Accounting\QuotationService;
use App\Services\Accounting\AutofillService;

try {
    echo "🌐 Testing Quotation API with Special Discount and Withholding Tax\n";
    echo "=" . str_repeat("=", 70) . "\n\n";
    
    // สร้าง mock user สำหรับ authentication
    $user = \App\Models\User::first();
    if (!$user) {
        throw new \Exception('No users found in database');
    }
    
    // Mock authentication
    auth()->login($user);
    
    // สร้าง test data สำหรับ API
    $apiData = [
        'customer_company' => 'API TEST COMPANY',
        'work_name' => 'API Test Quotation with Discount and Tax',
        'subtotal' => 15000.00,
        'tax_amount' => 1050.00,
        'total_amount' => 16050.00,
        'special_discount_percentage' => 10.00,
        'special_discount_amount' => 1605.00, // 16050 * 10% = 1605
        'has_withholding_tax' => true,
        'withholding_tax_percentage' => 5.00,
        'withholding_tax_amount' => 750.00, // 15000 * 5% = 750 (คำนวณจากยอดก่อนภาษี)
        'final_total_amount' => 13695.00, // 16050 - 1605 - 750 = 13695
        'deposit_percentage' => 30,
        'payment_terms' => 'credit_30',
        'notes' => 'API test quotation with special discount and withholding tax calculations'
    ];
    
    echo "📝 API Test Data:\n";
    echo "Subtotal: ฿" . number_format($apiData['subtotal'], 2) . "\n";
    echo "VAT (7%): ฿" . number_format($apiData['tax_amount'], 2) . "\n";
    echo "Total: ฿" . number_format($apiData['total_amount'], 2) . "\n";
    echo "Special Discount ({$apiData['special_discount_percentage']}%): -฿" . number_format($apiData['special_discount_amount'], 2) . "\n";
    echo "Withholding Tax ({$apiData['withholding_tax_percentage']}%): -฿" . number_format($apiData['withholding_tax_amount'], 2) . "\n";
    echo "Final Total: ฿" . number_format($apiData['final_total_amount'], 2) . "\n\n";
    
    // สร้าง Request object
    $request = new Request();
    $request->merge($apiData);
    
    // สร้าง Controller และ dependencies
    $autofillService = new AutofillService();
    $quotationService = new QuotationService($autofillService);
    $controller = new QuotationController($quotationService);
    
    echo "🚀 Calling QuotationController::store...\n";
    
    // เรียก API
    $response = $controller->store($request);
    $responseData = json_decode($response->getContent(), true);
    
    echo "✅ API Response Status: " . $response->getStatusCode() . "\n";
    echo "✅ API Success: " . ($responseData['success'] ? 'Yes' : 'No') . "\n";
    echo "✅ API Message: " . ($responseData['message'] ?? 'No message') . "\n\n";
    
    if ($responseData['success'] && isset($responseData['data'])) {
        $quotation = $responseData['data'];
        
        echo "📋 Created Quotation Details:\n";
        echo "✓ ID: {$quotation['id']}\n";
        echo "✓ Number: " . ($quotation['number'] ?? 'N/A') . "\n";
        echo "✓ Work Name: " . ($quotation['work_name'] ?? 'N/A') . "\n";
        echo "✓ Status: " . ($quotation['status'] ?? 'N/A') . "\n";
        echo "✓ Subtotal: ฿" . number_format($quotation['subtotal'] ?? 0, 2) . "\n";
        echo "✓ Tax Amount: ฿" . number_format($quotation['tax_amount'] ?? 0, 2) . "\n";
        echo "✓ Total Amount: ฿" . number_format($quotation['total_amount'] ?? 0, 2) . "\n";
        echo "✓ Special Discount %: " . ($quotation['special_discount_percentage'] ?? 0) . "%\n";
        echo "✓ Special Discount Amount: ฿" . number_format($quotation['special_discount_amount'] ?? 0, 2) . "\n";
        echo "✓ Has Withholding Tax: " . (($quotation['has_withholding_tax'] ?? false) ? 'Yes' : 'No') . "\n";
        echo "✓ Withholding Tax %: " . ($quotation['withholding_tax_percentage'] ?? 0) . "%\n";
        echo "✓ Withholding Tax Amount: ฿" . number_format($quotation['withholding_tax_amount'] ?? 0, 2) . "\n";
        echo "✓ Final Total Amount: ฿" . number_format($quotation['final_total_amount'] ?? 0, 2) . "\n\n";
        
        // ทดสอบ GET API
        echo "🔍 Testing GET API...\n";
        $getResponse = $controller->show($quotation['id']);
        $getResponseData = json_decode($getResponse->getContent(), true);
        
        if ($getResponseData['success']) {
            echo "✅ GET API Success: Data retrieved successfully\n";
            $retrievedQuotation = $getResponseData['data'];
            
            // ตรวจสอบ calculated values ที่มาจาก Model Accessors
            echo "\n🧮 Model Accessor Values:\n";
            echo "✓ Calculated Withholding Tax: ฿" . number_format($retrievedQuotation['calculated_withholding_tax'], 2) . "\n";
            echo "✓ Net After Discount: ฿" . number_format($retrievedQuotation['net_after_discount'], 2) . "\n";
            echo "✓ Final Net Amount: ฿" . number_format($retrievedQuotation['final_net_amount'], 2) . "\n";
        } else {
            echo "❌ GET API Failed: " . ($getResponseData['message'] ?? 'Unknown error') . "\n";
        }
        
        // ลบข้อมูลทดสอบ
        echo "\n🗑️ Cleaning up test data...\n";
        \App\Models\Accounting\Quotation::find($quotation['id'])->delete();
        echo "✅ Test quotation deleted\n";
        
    } else {
        echo "❌ API Failed: " . ($responseData['message'] ?? 'Unknown error') . "\n";
        if (isset($responseData['errors'])) {
            echo "Validation Errors:\n";
            foreach ($responseData['errors'] as $field => $errors) {
                echo "  - {$field}: " . implode(', ', $errors) . "\n";
            }
        }
    }
    
    echo "\n✨ API test completed!\n";
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "📍 Line: " . $e->getLine() . "\n";
    echo "📁 File: " . $e->getFile() . "\n";
}
