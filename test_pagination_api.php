<?php

/**
 * Test Pagination API
 */

$baseUrl = 'http://localhost:8000/api/v1';

echo "🧪 Testing Pagination for Pricing Integration\n";
echo "==========================================\n\n";

function makeRequest($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return json_decode($result, true);
    }
    
    echo "HTTP Error: $httpCode\n";
    echo "Response: $result\n";
    return false;
}

// Test 1: Default pagination (page 1, 20 items)
echo "1️⃣ Testing default pagination (page 1, 20 items)...\n";
$response = makeRequest("$baseUrl/pricing-requests");
if ($response) {
    echo "✅ Success\n";
    echo "Total: " . ($response['pagination']['total'] ?? 0) . "\n";
    echo "Current Page: " . ($response['pagination']['current_page'] ?? 0) . "\n";
    echo "Per Page: " . ($response['pagination']['per_page'] ?? 0) . "\n";
    echo "Last Page: " . ($response['pagination']['last_page'] ?? 0) . "\n";
    echo "Data Count: " . count($response['data'] ?? []) . "\n\n";
}

// Test 2: Page 2
echo "2️⃣ Testing page 2...\n";
$response = makeRequest("$baseUrl/pricing-requests?page=2");
if ($response) {
    echo "✅ Success\n";
    echo "Current Page: " . ($response['pagination']['current_page'] ?? 0) . "\n";
    echo "Data Count: " . count($response['data'] ?? []) . "\n\n";
}

// Test 3: 50 items per page
echo "3️⃣ Testing 50 items per page...\n";
$response = makeRequest("$baseUrl/pricing-requests?per_page=50");
if ($response) {
    echo "✅ Success\n";
    echo "Per Page: " . ($response['pagination']['per_page'] ?? 0) . "\n";
    echo "Data Count: " . count($response['data'] ?? []) . "\n\n";
}

// Test 4: 100 items per page
echo "4️⃣ Testing 100 items per page...\n";
$response = makeRequest("$baseUrl/pricing-requests?per_page=100");
if ($response) {
    echo "✅ Success\n";
    echo "Per Page: " . ($response['pagination']['per_page'] ?? 0) . "\n";
    echo "Data Count: " . count($response['data'] ?? []) . "\n\n";
}

echo "🏁 Pagination test completed!\n";
