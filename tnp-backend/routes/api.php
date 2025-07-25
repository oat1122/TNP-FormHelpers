<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\V1\User\UserController;
use App\Http\Controllers\Api\V1\MonitorProduction\ProductionController;
use App\Http\Controllers\Api\V1\MonitorProduction\BlockController;
use App\Http\Controllers\Api\V1\MonitorProduction\ProductionCostController;
use App\Http\Controllers\Api\V1\MonitorProduction\NoteController;
use App\Http\Controllers\Api\V1\CostCalc\CostFabricController;
use App\Http\Controllers\Api\V1\CostCalc\PatternController;
use App\Http\Controllers\Api\V1\Worksheet\WorksheetController;
use App\Http\Controllers\Api\V1\Worksheet\ShirtPatternController;
use App\Http\Controllers\Api\V1\Customers\CustomerController;
use App\Http\Controllers\Api\V1\LocationController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\GlobalController;
use App\Http\Controllers\Api\V1\Pricing\PricingController;
use App\Http\Controllers\Api\V1\MaxSupply\MaxSupplyController;
use App\Http\Controllers\Api\V1\MaxSupply\CalendarController;
use App\Http\Controllers\Api\V1\Accounting\QuotationController;
use App\Http\Controllers\Api\V1\Accounting\InvoiceController;
use App\Http\Controllers\Api\V1\Accounting\ReceiptController;
use App\Http\Controllers\Api\V1\Accounting\DeliveryNoteController;
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
    
    //---------- MaxSupply ----------
    Route::prefix('max-supplies')->group(function () {
        Route::get('/', [MaxSupplyController::class, 'index']);
        Route::post('/', [MaxSupplyController::class, 'store']);
        Route::get('/statistics', [MaxSupplyController::class, 'statistics']);
        Route::get('/{id}', [MaxSupplyController::class, 'show']);
        Route::put('/{id}', [MaxSupplyController::class, 'update']);
        Route::delete('/{id}', [MaxSupplyController::class, 'destroy']);
        Route::patch('/{id}/status', [MaxSupplyController::class, 'updateStatus']);
    });
});

Route::prefix('v1')->group(function() {

    Route::post('/login', [AuthController::class, 'login']);

    Route::apiResources([
        //---------- Monitor Production ----------
        'production' => ProductionController::class,
        'note' => NoteController::class,

        //---------- Cost Calculator ----------
        'pattern' => PatternController::class,
        'costFabric' => CostFabricController::class,

        //---------- Worksheet ----------
        'worksheets' => WorksheetController::class,
        'shirt-patterns' => ShirtPatternController::class,

        //---------- Location ----------
        'locations' => LocationController::class,

        //---------- Customers ----------
        'customers' => CustomerController::class,

        //---------- Pricing Request ----------
        'pricing' => PricingController::class,
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

        // ดึงข้อมูล worksheet จากระบบ NewWorksNet
        Route::get('/worksheets-newworksnet', 'getFromNewWorksNet');

        Route::post('/worksheet-gen-pdf', 'generatePdf');
        Route::post('/worksheet-upload-image', 'uploadImage');

        Route::put('/worksheet-update-status', 'updateStatus');

        // // for test gen pdf
        // Route::get('/test-worksheet-gen-pdf/{id}/{sheet}/{role}', 'generatePdfGet');
    });

    //---------- Customer ----------
    Route::put('/customerRecall/{id}', [CustomerController::class, 'recall']);
    Route::put('/customerChangeGrade/{id}', [CustomerController::class, 'changeGrade']);
    Route::get('/customerGroupCounts', [CustomerController::class, 'getGroupCounts']);

    //---------- Pricing ----------
    Route::controller(PricingController::class)->group(function () {
        Route::put('/pricing-update-status', 'update_status');
    });

    //---------- Accounting ----------
    // Quotations
    Route::prefix('quotations')->group(function () {
        Route::get('/', [QuotationController::class, 'index']);
        Route::post('/', [QuotationController::class, 'store']);
        Route::get('/{id}', [QuotationController::class, 'show']);
        Route::put('/{id}', [QuotationController::class, 'update']);
        Route::delete('/{id}', [QuotationController::class, 'destroy']);
        Route::patch('/{id}/status', [QuotationController::class, 'changeStatus']);
        Route::get('/{id}/pdf', [QuotationController::class, 'generatePdf']);
        Route::get('/{id}/history', [QuotationController::class, 'getHistory']);
    });

    // Invoices
    Route::prefix('invoices')->group(function () {
        Route::get('/', [InvoiceController::class, 'index']);
        Route::post('/', [InvoiceController::class, 'store']);
        Route::get('/overdue', [InvoiceController::class, 'getOverdue']);
        Route::get('/{id}', [InvoiceController::class, 'show']);
        Route::put('/{id}', [InvoiceController::class, 'update']);
        Route::delete('/{id}', [InvoiceController::class, 'destroy']);
        Route::patch('/{id}/status', [InvoiceController::class, 'changeStatus']);
        Route::post('/{id}/payment', [InvoiceController::class, 'recordPayment']);
        Route::get('/{id}/pdf', [InvoiceController::class, 'generatePdf']);
        Route::get('/{id}/history', [InvoiceController::class, 'getHistory']);
    });

    // Receipts
    Route::prefix('receipts')->group(function () {
        Route::get('/', [ReceiptController::class, 'index']);
        Route::post('/', [ReceiptController::class, 'store']);
        Route::get('/{id}', [ReceiptController::class, 'show']);
        Route::put('/{id}', [ReceiptController::class, 'update']);
        Route::delete('/{id}', [ReceiptController::class, 'destroy']);
        Route::patch('/{id}/status', [ReceiptController::class, 'changeStatus']);
        Route::get('/{id}/pdf', [ReceiptController::class, 'generatePdf']);
        Route::get('/{id}/history', [ReceiptController::class, 'getHistory']);
    });

    // Delivery Notes
    Route::prefix('delivery-notes')->group(function () {
        Route::get('/', [DeliveryNoteController::class, 'index']);
        Route::post('/', [DeliveryNoteController::class, 'store']);
        Route::post('/partial', [DeliveryNoteController::class, 'storePartial']);
        Route::get('/pending', [DeliveryNoteController::class, 'getPending']);
        Route::get('/customer/{customerId}/summary', [DeliveryNoteController::class, 'getCustomerSummary']);
        Route::get('/{id}', [DeliveryNoteController::class, 'show']);
        Route::put('/{id}', [DeliveryNoteController::class, 'update']);
        Route::delete('/{id}', [DeliveryNoteController::class, 'destroy']);
        Route::patch('/{id}/status', [DeliveryNoteController::class, 'changeStatus']);
        Route::get('/{id}/pdf', [DeliveryNoteController::class, 'generatePdf']);
        Route::get('/{id}/history', [DeliveryNoteController::class, 'getHistory']);
    });

    //---------- Calendar ----------
    Route::prefix('calendar')->group(function () {
        require __DIR__.'/calendar.php';
    });

    //---------- Global ----------
    Route::controller(GlobalController::class)->group(function () {
        Route::get('/get-all-product-categories', 'get_all_product_categories');
        Route::get('/get-all-business-types', 'get_all_business_types');
        Route::post('/business-types', 'store_business_type');
        Route::put('/business-types/{id}', 'update_business_type');
        Route::delete('/business-types/{id}', 'delete_business_type');
        Route::get('/get-status-by-type/{status_type}', 'get_status_by_type');
    });
});
