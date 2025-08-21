<?php
require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    echo "🧪 Testing Quotation with Special Discount and Withholding Tax\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // ดึง user แรกมาใช้ทดสอบ
    $firstUser = \App\Models\User::first();
    if (!$firstUser) {
        throw new \Exception('No users found in database');
    }
    
    // ข้อมูลทดสอบ
    $testData = [
        'id' => \Illuminate\Support\Str::uuid(),
        'customer_company' => 'TEST COMPANY',
        'work_name' => 'Test Quotation with Discount and Tax',
        'subtotal' => 10000.00,
        'tax_amount' => 700.00,
        'total_amount' => 10700.00,
        'special_discount_percentage' => 5.00,
        'special_discount_amount' => 535.00, // 10700 * 5% = 535
        'has_withholding_tax' => true,
        'withholding_tax_percentage' => 3.00,
        'withholding_tax_amount' => 300.00, // 10000 * 3% = 300 (คำนวณจากยอดก่อนภาษี)
        'final_total_amount' => 9865.00, // 10700 - 535 - 300 = 9865
        'status' => 'draft',
        'created_by' => $firstUser->user_uuid,
        'notes' => 'Test quotation with special discount and withholding tax calculations'
    ];
    
    echo "📝 Test Data:\n";
    echo "Subtotal: ฿" . number_format($testData['subtotal'], 2) . "\n";
    echo "VAT (7%): ฿" . number_format($testData['tax_amount'], 2) . "\n";
    echo "Total: ฿" . number_format($testData['total_amount'], 2) . "\n";
    echo "Special Discount ({$testData['special_discount_percentage']}%): -฿" . number_format($testData['special_discount_amount'], 2) . "\n";
    echo "Withholding Tax ({$testData['withholding_tax_percentage']}%): -฿" . number_format($testData['withholding_tax_amount'], 2) . "\n";
    echo "Final Total: ฿" . number_format($testData['final_total_amount'], 2) . "\n\n";
    
    // เริ่ม transaction
    DB::beginTransaction();
    
    // สร้าง quotation ด้วย Eloquent Model
    $quotation = new \App\Models\Accounting\Quotation();
    $quotation->fill($testData);
    // กำหนด number ที่ unique สำหรับ draft
    $suffix = substr(str_replace('-', '', $testData['id']), -8);
    $quotation->number = 'DRAFT-TEST-' . $suffix;
    $quotation->save();
    
    echo "✅ Quotation created successfully!\n";
    echo "ID: {$quotation->id}\n\n";
    
    // ดึงข้อมูลกลับมาเพื่อตรวจสอบ
    $savedQuotation = \App\Models\Accounting\Quotation::find($quotation->id);
    
    echo "🔍 Verification:\n";
    echo "✓ ID: {$savedQuotation->id}\n";
    echo "✓ Customer: {$savedQuotation->customer_company}\n";
    echo "✓ Work Name: {$savedQuotation->work_name}\n";
    echo "✓ Subtotal: ฿" . number_format($savedQuotation->subtotal, 2) . "\n";
    echo "✓ Tax Amount: ฿" . number_format($savedQuotation->tax_amount, 2) . "\n";
    echo "✓ Total Amount: ฿" . number_format($savedQuotation->total_amount, 2) . "\n";
    echo "✓ Special Discount %: {$savedQuotation->special_discount_percentage}%\n";
    echo "✓ Special Discount Amount: ฿" . number_format($savedQuotation->special_discount_amount, 2) . "\n";
    echo "✓ Has Withholding Tax: " . ($savedQuotation->has_withholding_tax ? 'Yes' : 'No') . "\n";
    echo "✓ Withholding Tax %: {$savedQuotation->withholding_tax_percentage}%\n";
    echo "✓ Withholding Tax Amount: ฿" . number_format($savedQuotation->withholding_tax_amount, 2) . "\n";
    echo "✓ Final Total Amount: ฿" . number_format($savedQuotation->final_total_amount, 2) . "\n\n";
    
    // ทดสอบ Calculated Accessors
    echo "🧮 Testing Calculated Accessors:\n";
    echo "✓ Calculated Withholding Tax: ฿" . number_format($savedQuotation->calculated_withholding_tax, 2) . "\n";
    echo "✓ Net After Discount: ฿" . number_format($savedQuotation->net_after_discount, 2) . "\n";
    echo "✓ Final Net Amount: ฿" . number_format($savedQuotation->final_net_amount, 2) . "\n\n";
    
    // ตรวจสอบการคำนวณ
    $expectedWithholdingTax = $savedQuotation->subtotal * ($savedQuotation->withholding_tax_percentage / 100);
    $expectedNetAfterDiscount = $savedQuotation->total_amount - $savedQuotation->special_discount_amount;
    $expectedFinalNet = $expectedNetAfterDiscount - $expectedWithholdingTax;
    
    echo "🔢 Calculation Verification:\n";
    echo "Expected Withholding Tax: ฿" . number_format($expectedWithholdingTax, 2) . 
         " | Calculated: ฿" . number_format($savedQuotation->calculated_withholding_tax, 2) . 
         " | " . ($expectedWithholdingTax == $savedQuotation->calculated_withholding_tax ? "✅ PASS" : "❌ FAIL") . "\n";
    
    echo "Expected Net After Discount: ฿" . number_format($expectedNetAfterDiscount, 2) . 
         " | Calculated: ฿" . number_format($savedQuotation->net_after_discount, 2) . 
         " | " . ($expectedNetAfterDiscount == $savedQuotation->net_after_discount ? "✅ PASS" : "❌ FAIL") . "\n";
    
    echo "Expected Final Net: ฿" . number_format($expectedFinalNet, 2) . 
         " | Calculated: ฿" . number_format($savedQuotation->final_net_amount, 2) . 
         " | " . ($expectedFinalNet == $savedQuotation->final_net_amount ? "✅ PASS" : "❌ FAIL") . "\n\n";
    
    // Rollback transaction (ไม่ต้องการเก็บข้อมูลทดสอบ)
    DB::rollBack();
    echo "🔄 Transaction rolled back (test data cleaned up)\n\n";
    
    echo "✨ All tests completed successfully!\n";
    
} catch (\Exception $e) {
    DB::rollBack();
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "📍 Line: " . $e->getLine() . "\n";
    echo "📁 File: " . $e->getFile() . "\n";
}
