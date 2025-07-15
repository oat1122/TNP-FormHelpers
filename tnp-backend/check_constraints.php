<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    echo "Max supplies table structure:\n";
    $columns = DB::select('DESCRIBE max_supplies');
    foreach ($columns as $column) {
        echo "- {$column->Field}: {$column->Type} " . ($column->Key ? "({$column->Key})" : "") . "\n";
    }
    
    echo "\nActivity logs max_supply_id column:\n";
    $activityColumns = DB::select('DESCRIBE activity_logs');
    foreach ($activityColumns as $column) {
        if ($column->Field === 'max_supply_id') {
            echo "- {$column->Field}: {$column->Type} " . ($column->Key ? "({$column->Key})" : "") . "\n";
        }
    }
    
    // Test creating a MaxSupply with UUID
    echo "\nTesting MaxSupply creation with UUID:\n";
    $maxSupply = new \App\Models\MaxSupply();
    $maxSupply->code = 'TEST-UUID-001';
    $maxSupply->worksheet_id = \Illuminate\Support\Str::uuid()->toString();
    $maxSupply->title = 'Test UUID Creation';
    $maxSupply->customer_name = 'Test Customer';
    $maxSupply->production_type = 'screen';
    $maxSupply->start_date = '2025-07-15';
    $maxSupply->expected_completion_date = '2025-07-20';
    $maxSupply->due_date = '2025-07-22';
    $maxSupply->shirt_type = 't-shirt';
    $maxSupply->total_quantity = 100;
    $maxSupply->sizes = json_encode(['M' => 50, 'L' => 50]);
    $maxSupply->screen_points = 1;
    
    if ($maxSupply->save()) {
        echo "✅ MaxSupply created successfully with UUID: " . $maxSupply->id . "\n";
        
        // Clean up test data
        $maxSupply->delete();
        echo "✅ Test data cleaned up\n";
    } else {
        echo "❌ Failed to create MaxSupply\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
