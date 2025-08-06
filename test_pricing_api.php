<?php

/**
 * Test script สำหรับทดสอบ Pricing Integration API
 * รันด้วยคำสั่ง: php test_pricing_api.php
 */

// ตั้งค่า base URL
$baseUrl = 'http://localhost:8000/api/v1';

echo "🧪 Testing TNP Accounting - Pricing Integration API\n";
echo "==========================================\n\n";

// Test 1: ทดสอบ Dashboard Stats
echo "1️⃣ Testing Dashboard Stats...\n";
$response = makeRequest("$baseUrl/dashboard/stats");
if ($response) {
    echo "✅ Dashboard Stats API working\n";
    echo "Data: " . json_encode($response['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
} else {
    echo "❌ Dashboard Stats API failed\n\n";
}

// Test 2: ทดสอบ Pricing Requests
echo "2️⃣ Testing Pricing Requests...\n";
$response = makeRequest("$baseUrl/pricing-requests");
if ($response) {
    echo "✅ Pricing Requests API working\n";
    echo "Total Records: " . ($response['pagination']['total'] ?? 0) . "\n";
    echo "Data Count: " . count($response['data'] ?? []) . "\n\n";
    
    // แสดงตัวอย่างข้อมูล 1 รายการ
    if (!empty($response['data'])) {
        echo "Sample Record:\n";
        echo json_encode($response['data'][0], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
    }
} else {
    echo "❌ Pricing Requests API failed\n\n";
}

// Test 3: ทดสอบ Pricing Request Autofill (ถ้ามีข้อมูล)
if (!empty($response['data'])) {
    $prId = $response['data'][0]['pr_id'];
    echo "3️⃣ Testing Pricing Request Autofill (ID: $prId)...\n";
    $autofillResponse = makeRequest("$baseUrl/pricing-requests/$prId/autofill");
    if ($autofillResponse) {
        echo "✅ Pricing Request Autofill API working\n";
        echo "Autofill Data: " . json_encode($autofillResponse['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
    } else {
        echo "❌ Pricing Request Autofill API failed\n\n";
    }
}

echo "🏁 Test completed!\n";

/**
 * ฟังก์ชันสำหรับเรียก API
 */
function makeRequest($url)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "CURL Error: $error\n";
        return false;
    }
    
    if ($httpCode !== 200) {
        echo "HTTP Error: $httpCode\n";
        echo "Response: $response\n";
        return false;
    }
    
    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo "JSON Error: " . json_last_error_msg() . "\n";
        echo "Raw Response: $response\n";
        return false;
    }
    
    return $data;
}
