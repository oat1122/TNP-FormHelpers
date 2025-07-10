<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\MaxSupply\CalendarController;

/*
|--------------------------------------------------------------------------
| Calendar API Routes
|--------------------------------------------------------------------------
|
| These routes handle all calendar related API requests
|
*/

// Simple test route to verify route is working
Route::get('/test', function() {
    return response()->json([
        'status' => 'success',
        'message' => 'Calendar API is working!',
        'timestamp' => now()->toDateTimeString()
    ]);
});

// Main calendar routes
Route::get('/', [CalendarController::class, 'index']);
Route::get('/week/{date}', [CalendarController::class, 'weeklyData'])->where('date', '[0-9]{4}-[0-9]{2}-[0-9]{2}');
Route::get('/day/{date}', [CalendarController::class, 'dailyData'])->where('date', '[0-9]{4}-[0-9]{2}-[0-9]{2}');
Route::get('/{year}/{month}', [CalendarController::class, 'monthlyData'])->where(['year' => '[0-9]{4}', 'month' => '[0-9]{1,2}']);
