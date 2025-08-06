<?php

/**
 * Manual Database Check for Pricing Requests
 * ตรวจสอบข้อมูลในฐานข้อมูลว่ามี Pricing Request ที่สถานะ "ได้ราคาแล้ว" หรือไม่
 */

require_once 'vendor/autoload.php';

// เชื่อมต่อฐานข้อมูล
try {
    $host = env('DB_HOST', 'localhost');
    $dbname = env('DB_DATABASE', 'tnp_formhelpers');
    $username = env('DB_USERNAME', 'root');
    $password = env('DB_PASSWORD', '');
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "🔌 Database connection successful!\n\n";
    
    // ตรวจสอบ Pricing Requests ที่สถานะ "ได้ราคาแล้ว"
    $statusId = '20db8be1-092b-11f0-b223-38ca84abdf0a';
    
    $query = "
        SELECT 
            pr.pr_id,
            pr.pr_work_name,
            pr.pr_pattern,
            pr.pr_quantity,
            pr.pr_status_id,
            pr.pr_is_deleted,
            pr.pr_created_date,
            pr.pr_updated_date,
            ps.status_name,
            c.cus_company
        FROM pricing_requests pr
        LEFT JOIN pricing_status ps ON pr.pr_status_id = ps.status_id
        LEFT JOIN master_customers c ON pr.pr_cus_id = c.cus_id
        WHERE pr.pr_is_deleted = 0
        ORDER BY pr.pr_updated_date DESC
        LIMIT 10
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $allRecords = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "📊 Total Pricing Requests (Top 10):\n";
    echo "=====================================\n";
    foreach ($allRecords as $record) {
        $isTarget = $record['pr_status_id'] === $statusId ? '✅' : '❌';
        echo "$isTarget ID: {$record['pr_id']} | {$record['pr_work_name']} | Status: {$record['status_name']} | Company: {$record['cus_company']}\n";
    }
    
    // ตรวจสอบเฉพาะที่สถานะ "ได้ราคาแล้ว"
    $targetQuery = "
        SELECT 
            pr.pr_id,
            pr.pr_work_name,
            pr.pr_pattern,
            pr.pr_quantity,
            ps.status_name,
            c.cus_company
        FROM pricing_requests pr
        LEFT JOIN pricing_status ps ON pr.pr_status_id = ps.status_id
        LEFT JOIN master_customers c ON pr.pr_cus_id = c.cus_id
        WHERE pr.pr_status_id = :status_id 
        AND pr.pr_is_deleted = 0
        ORDER BY pr.pr_updated_date DESC
    ";
    
    $stmt = $pdo->prepare($targetQuery);
    $stmt->execute(['status_id' => $statusId]);
    $targetRecords = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\n🎯 Target Status Records (ได้ราคาแล้ว):\n";
    echo "==========================================\n";
    if (empty($targetRecords)) {
        echo "❌ ไม่พบข้อมูล Pricing Request ที่สถานะ 'ได้ราคาแล้ว'\n";
        echo "💡 แนะนำ: ใส่ข้อมูลทดสอบ หรือเปลี่ยนสถานะของ Pricing Request ที่มีอยู่\n";
    } else {
        echo "✅ พบ " . count($targetRecords) . " รายการ:\n";
        foreach ($targetRecords as $record) {
            echo "   - ID: {$record['pr_id']} | {$record['pr_work_name']} | {$record['cus_company']}\n";
        }
    }
    
    // ตรวจสอบ Status ทั้งหมด
    $statusQuery = "SELECT status_id, status_name FROM pricing_status ORDER BY status_name";
    $stmt = $pdo->prepare($statusQuery);
    $stmt->execute();
    $statuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\n📋 Available Status List:\n";
    echo "==========================\n";
    foreach ($statuses as $status) {
        $isTarget = $status['status_id'] === $statusId ? '🎯' : '  ';
        echo "$isTarget {$status['status_id']} - {$status['status_name']}\n";
    }
    
} catch (Exception $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
}

function env($key, $default = null) {
    return $_ENV[$key] ?? $default;
}
