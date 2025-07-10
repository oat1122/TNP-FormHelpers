<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Get the schema for new_worksheets table
try {
    $columns = DB::select('DESCRIBE new_worksheets');
    echo "===== new_worksheets Table Structure =====\n";
    foreach ($columns as $column) {
        echo $column->Field . ' - ' . $column->Type . ' - ' . ($column->Key == 'PRI' ? 'Primary Key' : $column->Key) . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";

    // If table doesn't exist, let's check all tables
    echo "\n===== All Tables =====\n";
    $tables = DB::select('SHOW TABLES');
    foreach ($tables as $table) {
        echo array_values(get_object_vars($table))[0] . "\n";
    }
}
