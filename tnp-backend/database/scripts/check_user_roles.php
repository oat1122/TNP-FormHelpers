<?php
/**
 * Phase 4.2: User Role Verification Script
 * 
 * Purpose: Verify user roles are properly set up
 * - Check if 'telesale' role exists in users table
 * - List all users by role
 * - Verify role enum values
 * 
 * Usage: php database/scripts/check_user_roles.php
 */

require __DIR__ . '/../../vendor/autoload.php';

$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=======================================================\n";
echo "TNP User Role Verification (Phase 4.2)\n";
echo "=======================================================\n\n";

// 1. Check total users
$totalUsers = DB::table('users')
    ->where('user_is_enable', true)
    ->where('user_is_deleted', false)
    ->count();
echo "📊 Total Active Users: {$totalUsers}\n\n";

// 2. Check role distribution
echo "📋 Role Distribution:\n";
echo "--------------------\n";
$roles = DB::table('users')
    ->select('role', DB::raw('COUNT(*) as count'))
    ->where('user_is_enable', true)
    ->where('user_is_deleted', false)
    ->groupBy('role')
    ->orderBy('count', 'desc')
    ->get();

$roleMap = [
    'admin' => 'Admin (ผู้ดูแลระบบ)',
    'manager' => 'Manager (ผู้จัดการ)',
    'sale' => 'Sale (เซลล์)',
    'telesale' => 'Telesale (ทีมโทร)',
    'production' => 'Production (งานผลิต)',
    'graphic' => 'Graphic (งานออกแบบ)',
    'technician' => 'Technician (ช่างเทคนิค)',
];

foreach ($roles as $role) {
    $roleValue = $role->role ?: '(empty/null)';
    $roleName = $roleMap[$role->role] ?? $roleValue;
    $percentage = round(($role->count / $totalUsers) * 100, 2);
    echo sprintf("  %-30s: %3d (%6.2f%%)\n", 
        $roleName, 
        $role->count, 
        $percentage
    );
}

// 3. Check for required roles
echo "\n🔍 Required Roles Check:\n";
echo "------------------------\n";

$requiredRoles = ['admin', 'manager', 'sale', 'telesale'];
$missingRoles = [];

foreach ($requiredRoles as $requiredRole) {
    $count = DB::table('users')
        ->where('role', $requiredRole)
        ->where('user_is_enable', true)
        ->where('user_is_deleted', false)
        ->count();
    
    if ($count > 0) {
        echo "  ✅ {$requiredRole}: {$count} user(s)\n";
    } else {
        echo "  ❌ {$requiredRole}: No users found\n";
        $missingRoles[] = $requiredRole;
    }
}

// 4. List telesale users
echo "\n📞 Telesale Users:\n";
echo "------------------\n";
$telesaleUsers = DB::table('users')
    ->where('role', 'telesale')
    ->where('user_is_enable', true)
    ->where('user_is_deleted', false)
    ->select('user_id', 'username', 'user_firstname', 'user_lastname', 'user_nickname', 'user_position')
    ->get();

if ($telesaleUsers->isEmpty()) {
    echo "  ⚠️  No telesale users found!\n";
} else {
    foreach ($telesaleUsers as $user) {
        $fullName = trim(($user->user_firstname ?? '') . ' ' . ($user->user_lastname ?? ''));
        $nickname = $user->user_nickname ? "({$user->user_nickname})" : '';
        echo sprintf("  [%3d] %-20s %-30s %s\n", 
            $user->user_id,
            $user->username,
            $fullName,
            $nickname
        );
    }
}

// 5. List managers (who can allocate customers)
echo "\n👔 Managers (Can Allocate Customers):\n";
echo "--------------------------------------\n";
$managers = DB::table('users')
    ->whereIn('role', ['admin', 'manager'])
    ->where('user_is_enable', true)
    ->where('user_is_deleted', false)
    ->select('user_id', 'role', 'username', 'user_firstname', 'user_lastname', 'user_nickname')
    ->get();

if ($managers->isEmpty()) {
    echo "  ⚠️  No managers or admins found!\n";
} else {
    foreach ($managers as $user) {
        $fullName = trim(($user->user_firstname ?? '') . ' ' . ($user->user_lastname ?? ''));
        $nickname = $user->user_nickname ? "({$user->user_nickname})" : '';
        echo sprintf("  [%3d] %-8s %-20s %-30s %s\n", 
            $user->user_id,
            $user->role,
            $user->username,
            $fullName,
            $nickname
        );
    }
}

// 6. List sales users (who can receive assignments)
echo "\n💼 Sales Users (Can Receive Assignments):\n";
echo "------------------------------------------\n";
$salesUsers = DB::table('users')
    ->where('role', 'sale')
    ->where('user_is_enable', true)
    ->where('user_is_deleted', false)
    ->select('user_id', 'username', 'user_firstname', 'user_lastname', 'user_nickname')
    ->get();

if ($salesUsers->isEmpty()) {
    echo "  ⚠️  No sales users found!\n";
} else {
    foreach ($salesUsers as $user) {
        $fullName = trim(($user->user_firstname ?? '') . ' ' . ($user->user_lastname ?? ''));
        $nickname = $user->user_nickname ? "({$user->user_nickname})" : '';
        echo sprintf("  [%3d] %-20s %-30s %s\n", 
            $user->user_id,
            $user->username,
            $fullName,
            $nickname
        );
    }
}

// 7. Check for users with customer assignments
echo "\n📊 Users with Customer Assignments:\n";
echo "-----------------------------------\n";
$usersWithCustomers = DB::table('master_customers')
    ->join('users', 'master_customers.cus_manage_by', '=', 'users.user_id')
    ->select('users.user_id', 'users.username', 'users.role', DB::raw('COUNT(*) as customer_count'))
    ->where('master_customers.cus_is_use', true)
    ->groupBy('users.user_id', 'users.username', 'users.role')
    ->orderBy('customer_count', 'desc')
    ->get();

if ($usersWithCustomers->isEmpty()) {
    echo "  ℹ️  No users have customer assignments yet\n";
} else {
    foreach ($usersWithCustomers as $user) {
        echo sprintf("  [%3d] %-20s %-10s: %4d customers\n", 
            $user->user_id,
            $user->username,
            $user->role,
            $user->customer_count
        );
    }
}

// 8. Summary and recommendations
echo "\n=======================================================\n";
echo "✅ Verification Complete\n";
echo "=======================================================\n";

if (!empty($missingRoles)) {
    echo "\n⚠️  WARNING: Missing required roles!\n";
    echo "-------------------------------------\n";
    foreach ($missingRoles as $role) {
        echo "  • {$role}\n";
    }
    echo "\nTo add a telesale user, update an existing user:\n";
    echo "UPDATE users SET role = 'telesale' WHERE user_id = [USER_ID];\n";
} else {
    echo "\n✅ All required roles are present!\n";
}

// Check if telesale role is in enum
echo "\nℹ️  Note: Make sure 'telesale' is in the role enum.\n";
echo "Check migration: 2025_12_01_112351_alter_users_table_add_telesale_role.php\n";

echo "\n";
