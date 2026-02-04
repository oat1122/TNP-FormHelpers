<?php

use App\Models\Notebook;
use App\Models\NotebookHistory;
use Illuminate\Support\Facades\Auth;

// Mock user login
Auth::loginUsingId(1); // Assuming user ID 1 exists and is a valid user

echo "--- Starting Verification ---\n";

// 1. Create
echo "1. Creating Notebook...\n";
$notebook = Notebook::create([
    'nb_customer_name' => 'Test Customer History',
    'nb_date' => now(),
    'nb_is_online' => 1,
    'nb_status' => 'new'
]);

$history = NotebookHistory::where('notebook_id', $notebook->id)->latest('id')->first();
if ($history && $history->action === 'created') {
    echo "✅ Create history logged successfully. ID: {$history->id}\n";
} else {
    echo "❌ Failed to log create history. Found: " . ($history ? json_encode($history->toArray()) : 'NULL') . "\n";
}

// 2. Update
echo "2. Updating Notebook...\n";
$notebook->update([
    'nb_customer_name' => 'Updated Customer History'
]);

$history = NotebookHistory::where('notebook_id', $notebook->id)->latest('id')->first();
if ($history && $history->action === 'updated' && $history->new_values['nb_customer_name'] === 'Updated Customer History') {
    echo "✅ Update history logged successfully. ID: {$history->id}\n";
} else {
    echo "❌ Failed to log update history. Found: " . ($history ? json_encode($history->toArray()) : 'NULL') . "\n";
}

// 3. Delete
echo "3. Deleting Notebook...\n";
$id = $notebook->id;
$notebook->delete();

$history = NotebookHistory::where('notebook_id', $id)->latest('id')->first();
if ($history && $history->action === 'deleted') {
    echo "✅ Delete history logged successfully. ID: {$history->id}\n";
} else {
    echo "❌ Failed to log delete history. Found: " . ($history ? json_encode($history->toArray()) : 'NULL') . "\n";
}

echo "--- Verification Complete ---\n";
