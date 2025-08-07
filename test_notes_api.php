<?php

/**
 * Test script สำหรับทดสอบ Pricing Request Notes API
 * รันด้วยคำสั่ง: php test_notes_api.php
 */

// ตั้งค่า base URL
$baseUrl = 'http://localhost:8000/api/v1';

echo "🧪 Testing TNP Pricing Request Notes API\n";
echo "==========================================\n\n";

// Test 1: ทดสอบ Get Pricing Requests
echo "1️⃣ Testing Get Pricing Requests...\n";
$response = makeRequest("$baseUrl/pricing-requests");
if ($response && isset($response['data']) && count($response['data']) > 0) {
    echo "✅ Pricing Requests API working\n";
    echo "Total Records: " . ($response['pagination']['total'] ?? 0) . "\n";
    
    // ใช้งานแรกสำหรับทดสอบ
    $firstPricingRequest = $response['data'][0];
    $testPrId = $firstPricingRequest['pr_id'];
    $testWorkName = $firstPricingRequest['pr_work_name'];
    
    echo "Testing with PR ID: $testPrId\n";
    echo "Work Name: $testWorkName\n\n";
    
    // Test 2: ทดสอบ Get Notes
    echo "2️⃣ Testing Get Pricing Request Notes...\n";
    $notesResponse = makeRequest("$baseUrl/pricing-requests/$testPrId/notes");
    if ($notesResponse) {
        echo "✅ Notes API working\n";
        echo "Response: " . json_encode($notesResponse, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
    } else {
        echo "❌ Notes API failed\n\n";
    }
    
} else {
    echo "❌ Pricing Requests API failed or no data\n\n";
}

/**
 * Helper function สำหรับ API calls
 */
function makeRequest($url) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($error) {
        echo "❌ cURL Error: $error\n";
        return null;
    }
    
    if ($httpCode !== 200) {
        echo "❌ HTTP Error: $httpCode\n";
        echo "Response: $response\n";
        return null;
    }
    
    $data = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo "❌ JSON decode error: " . json_last_error_msg() . "\n";
        return null;
    }
    
    return $data;
}

echo "🎉 Testing completed!\n";
?>
