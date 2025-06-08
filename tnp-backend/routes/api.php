<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CostCalc\CostFabricController;
use App\Http\Controllers\Api\V1\CostCalc\PatternController;
use App\Http\Controllers\Api\V1\Customers\CustomerController;
use App\Http\Controllers\Api\V1\GlobalController;
use App\Http\Controllers\Api\V1\LocationController;
use App\Http\Controllers\Api\V1\MonitorProduction\BlockController;
use App\Http\Controllers\Api\V1\MonitorProduction\NoteController;
use App\Http\Controllers\Api\V1\MonitorProduction\ProductionController;
use App\Http\Controllers\Api\V1\MonitorProduction\ProductionCostController;
use App\Http\Controllers\Api\V1\Pricing\PricingController;
use App\Http\Controllers\Api\V1\User\UserController;
use App\Http\Controllers\Api\V1\Worksheet\ShirtPatternController;
use App\Http\Controllers\Api\V1\Worksheet\WorksheetController;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });

Route::middleware('web')->get('/v1/sanctum/csrf-cookie', [CsrfCookieController::class, 'show']);

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::get('/users', [UserController::class, 'index']);

    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::prefix('v1')->group(function () {

    Route::post('/login', [AuthController::class, 'login']);

    // Define specific routes before resource routes
    Route::get('/customers/sales', [CustomerController::class, 'getSales']);

    Route::apiResources([
        //---------- Monitor Production ----------
        'production'     => ProductionController::class,
        'note'           => NoteController::class,

        //---------- Cost Calculator ----------
        'pattern'        => PatternController::class,
        'costFabric'     => CostFabricController::class,

        //---------- Worksheet ----------
        'worksheets'     => WorksheetController::class,
        'shirt-patterns' => ShirtPatternController::class,

        //---------- Location ----------
        'locations'      => LocationController::class,

        //---------- Customers ----------
        'customers'      => CustomerController::class,

        //---------- Pricing Request ----------
        'pricing'        => PricingController::class,
    ]);

    //---------- User Management ----------
    Route::controller(UserController::class)->group(function () {
        // Route::get("/users", "index");
        Route::get("/get-users-by-role", "get_users_by_role");

        Route::post("/signup", "signup");
        // Route::post("/login", "login");
        Route::post("user/{username}", "userDetail");

        Route::put("/user/{id}", "update");
        Route::put('/users/{user}/reset-password', 'resetPassword')->name('users.reset-password');

        Route::delete("/user/{id}", "destroy");
    });

    //---------- start Monitor Production ----------
    Route::controller(ProductionController::class)->group(function () {
        Route::get('/getProduction', 'getProduction');
        Route::get('/getFactory', 'getFactory');
        Route::get('/getPdCount', 'getPdCount');
    });

    Route::controller(BlockController::class)->group(function () {
        Route::get('/getEnumEmbroid', 'getEnumEmbroid');
        Route::get('/getEnumScreen', 'getEnumScreen');
        Route::get('/getEnumDft', 'getEnumDft');

        Route::post('/updateBlock/{id}', 'updateBlock');
    });

    Route::controller(ProductionCostController::class)->group(function () {
        Route::get('/getCost/{id}', 'getCost');

        Route::post('/updateCost/{id}', 'updateCost');
        Route::post('/updateCost', 'updateCost');
    });
    //---------- end Monitor Production ----------

    //---------- Cost Calculator ----------
    Route::controller(CostFabricController::class)->group(function () {
        Route::get('/getEnumFabricClass', 'getEnumFabricClass');

        Route::put('/costFabric', 'update');
        Route::put('/costFabricOnce', 'updateOnce');
    });

    //---------- Worksheet ----------
    Route::controller(WorksheetController::class)->group(function () {
        Route::get('/get-all-customers', 'getAllCustomers');

        Route::post('/worksheet-gen-pdf', 'generatePdf');
        Route::post('/worksheet-upload-image', 'uploadImage');

        Route::put('/worksheet-update-status', 'updateStatus');

        // // for test gen pdf
        // Route::get('/test-worksheet-gen-pdf/{id}/{sheet}/{role}', 'generatePdfGet');
    });

    //---------- Customer ----------
    Route::put('/customerRecall/{id}', [CustomerController::class, 'recall']);

    //---------- Pricing ----------
    Route::controller(PricingController::class)->group(function () {
        Route::put('/pricing-update-status', 'update_status');
    });

    //---------- Global ----------
    Route::controller(GlobalController::class)->group(function () {
        Route::get('/get-all-product-categories', 'get_all_product_categories');
        Route::get('/get-status-by-type/{status_type}', 'get_status_by_type');
    });
});
