<?php
/**
 * Script to add or update a telesale user
 * 
 * Usage: php database/scripts/add_telesale_user.php
 */

require __DIR__ . '/../../vendor/autoload.php';

$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

echo "=======================================================\n";
echo "Add/Update Telesale User\n";
echo "=======================================================\n\n";

// Option 1: Update existing user
echo "Option 1: Update an existing user to telesale role\n";
echo "---------------------------------------------------\n";

$availableUsers = DB::table('users')
    ->where('user_is_enable', true)
    ->where('user_is_deleted', false)
    ->whereNotIn('role', ['telesale'])
    ->select('user_id', 'username', 'role', 'user_firstname', 'user_lastname', 'user_nickname')
    ->orderBy('user_id')
    ->get();

if ($availableUsers->isEmpty()) {
    echo "No available users to update.\n\n";
} else {
    echo "Available users:\n";
    foreach ($availableUsers->take(10) as $user) {
        $fullName = trim(($user->user_firstname ?? '') . ' ' . ($user->user_lastname ?? ''));
        $nickname = $user->user_nickname ? "({$user->user_nickname})" : '';
        echo sprintf("  [%3d] %-15s %-10s %-30s %s\n", 
            $user->user_id,
            $user->username,
            $user->role,
            $fullName,
            $nickname
        );
    }
    
    echo "\nTo update a user to telesale role, run:\n";
    echo "UPDATE users SET role = 'telesale' WHERE user_id = [USER_ID];\n\n";
}

// Option 2: Create new telesale user
echo "Option 2: Create a new telesale user\n";
echo "------------------------------------\n";
echo "Would you like to create a demo telesale user? (yes/no): ";

$handle = fopen("php://stdin", "r");
$line = trim(fgets($handle));

if (strtolower($line) === 'yes' || strtolower($line) === 'y') {
    echo "\nCreating demo telesale user...\n";
    
    // Check if demo user already exists
    $existingUser = DB::table('users')
        ->where('username', 'telesale_demo')
        ->first();
    
    if ($existingUser) {
        echo "⚠️  User 'telesale_demo' already exists (ID: {$existingUser->user_id})\n";
        echo "Updating to telesale role...\n";
        
        DB::table('users')
            ->where('user_id', $existingUser->user_id)
            ->update([
                'role' => 'telesale',
                'user_is_enable' => 1,
                'user_is_deleted' => 0,
                'enable' => 'Y',
                'deleted' => 0,
                'updated_at' => now()
            ]);
        
        echo "✅ Updated user 'telesale_demo' (ID: {$existingUser->user_id}) to telesale role\n";
    } else {
        // Get next user_id
        $maxUserId = DB::table('users')->max('user_id') ?? 0;
        $newUserId = $maxUserId + 1;
        
        // Create new user
        DB::table('users')->insert([
            'user_id' => $newUserId,
            'user_uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'username' => 'telesale_demo',
            'password' => Hash::make('password123'),
            'role' => 'telesale',
            'user_emp_no' => 'TEL-001',
            'user_firstname' => 'Demo',
            'user_lastname' => 'Telesales',
            'user_nickname' => 'Tel',
            'user_phone' => '0812345678',
            'user_position' => 'Telesales Staff',
            'enable' => 'Y',
            'user_is_enable' => 1,
            'deleted' => 0,
            'user_is_deleted' => 0,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        echo "✅ Created new telesale user:\n";
        echo "   Username: telesale_demo\n";
        echo "   Password: password123\n";
        echo "   User ID: {$newUserId}\n";
        echo "   Role: telesale\n";
        echo "\n⚠️  IMPORTANT: Change password after first login!\n";
    }
} else {
    echo "Skipped creating demo user.\n";
}

fclose($handle);

// Show current telesale users
echo "\n=======================================================\n";
echo "Current Telesale Users:\n";
echo "=======================================================\n";

$telesaleUsers = DB::table('users')
    ->where('role', 'telesale')
    ->where('user_is_enable', true)
    ->where('user_is_deleted', false)
    ->select('user_id', 'username', 'user_firstname', 'user_lastname', 'user_nickname')
    ->get();

if ($telesaleUsers->isEmpty()) {
    echo "No telesale users found.\n";
} else {
    foreach ($telesaleUsers as $user) {
        $fullName = trim(($user->user_firstname ?? '') . ' ' . ($user->user_lastname ?? ''));
        $nickname = $user->user_nickname ? "({$user->user_nickname})" : '';
        echo sprintf("[%3d] %-20s %-30s %s\n", 
            $user->user_id,
            $user->username,
            $fullName,
            $nickname
        );
    }
}

echo "\n✅ Done!\n\n";
