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
use App\Http\Controllers\Api\V1\Accounting\AutofillController;
use App\Http\Controllers\Api\V1\Accounting\QuotationController;
use App\Http\Controllers\Api\V1\Accounting\InvoiceController;
use App\Http\Controllers\Api\V1\Accounting\DeliveryNoteController;
use App\Http\Controllers\Api\V1\CompanyController;
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
    ]);

    // Additional customer routes for address management
    Route::controller(CustomerController::class)->group(function () {
        Route::post('/customers/parse-address', 'parseAddress');
        Route::post('/customers/build-address', 'buildAddress');
        Route::get('/customers/{id}/group-counts', 'getGroupCounts');
        Route::post('/customers/{id}/recall', 'recall');
        Route::patch('/customers/{id}/change-grade', 'changeGrade');
    });

    Route::apiResources([
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

    //---------- Companies ----------
    Route::controller(CompanyController::class)->group(function () {
        Route::get('/companies', 'index');
        Route::post('/companies', 'store');
        Route::get('/companies/{id}', 'show');
        Route::put('/companies/{id}', 'update');
        Route::delete('/companies/{id}', 'destroy');
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

    //---------- Accounting System ----------
    
    // Dashboard Stats
    Route::get('/dashboard/stats', function () {
        return response()->json([
            'success' => true,
            'data' => [
                'totalQuotations' => 15,
                'pendingApprovals' => 3,
                'completedDeliveries' => 8,
                'monthlyRevenue' => 250000,
                'recentActivities' => [
                    [
                        'id' => 1,
                        'title' => 'ใบเสนอราคา QT-2025-001',
                        'description' => 'บริษัท ABC จำกัด - เสื้อโปโล',
                        'status' => 'completed',
                        'time' => now()->subHours(2)->toISOString(),
                    ],
                    [
                        'id' => 2,
                        'title' => 'ใบเสนอราคา QT-2025-002',
                        'description' => 'ร้าน XYZ - เสื้อยืด',
                        'status' => 'pending',
                        'time' => now()->subHours(4)->toISOString(),
                    ],
                ],
            ],
        ]);
    });

    // Pricing Requests for Accounting Integration  
    Route::get('/pricing-requests', [\App\Http\Controllers\Api\V1\Accounting\AutofillController::class, 'getCompletedPricingRequests']);
    
    Route::get('/pricing-requests/{id}/autofill', [\App\Http\Controllers\Api\V1\Accounting\AutofillController::class, 'getPricingRequestAutofill']);
    
    // NEW: Pricing Request Notes API
    Route::get('/pricing-requests/{id}/notes', [\App\Http\Controllers\Api\V1\Accounting\AutofillController::class, 'getPricingRequestNotes']);
    
    // Auto-fill APIs
    Route::controller(AutofillController::class)->group(function () {
        // Pricing Request Auto-fill
        Route::get('/quotations/autofill/pricing-request/{id}', 'getPricingRequestAutofill');
        Route::get('/pricing/completed-requests', 'getCompletedPricingRequests');
        Route::post('/pricing/requests/{id}/mark-used', 'markPricingRequestAsUsed');
        
        // Customer Auto-fill
        Route::get('/customers/search', 'searchCustomers');
        Route::get('/customers/{id}/details', 'getCustomerDetails');
        
        // Cascade Auto-fill
        Route::get('/invoices/autofill/quotation/{id}', 'getQuotationAutofillForInvoice');
        Route::get('/receipts/autofill/invoice/{id}', 'getInvoiceAutofillForReceipt');
        Route::get('/delivery-notes/autofill/receipt/{id}', 'getReceiptAutofillForDeliveryNote');
    });

    // Quotation APIs
    Route::controller(QuotationController::class)->group(function () {
        Route::get('/quotations', 'index');
        Route::post('/quotations', 'store');
        Route::get('/quotations/{id}', 'show');
        Route::put('/quotations/{id}', 'update');
        Route::delete('/quotations/{id}', 'destroy');
        
        // Quotation Actions
        Route::post('/quotations/{id}/submit', 'submit');
        Route::post('/quotations/{id}/approve', 'approve');
        Route::post('/quotations/{id}/reject', 'reject');
        Route::post('/quotations/{id}/convert-to-invoice', 'convertToInvoice');
        
        // Step 1 Workflow APIs
        Route::post('/quotations/{id}/send-back', 'sendBack');
        Route::post('/quotations/{id}/revoke-approval', 'revokeApproval');
        // PDF APIs (Accounting-only, mPDF-first with FPDF fallback)
        Route::match(['get', 'post'], '/quotations/{id}/generate-pdf', 'generatePdf');
        Route::get('/quotations/{id}/pdf/stream', 'streamPdf');
        Route::get('/quotations/{id}/pdf/download', 'downloadPdf');
        Route::get('/quotations/{id}/pdf/test', 'testMpdf');
        Route::post('/quotations/{id}/send-email', 'sendEmail');
        Route::post('/quotations/{id}/upload-evidence', 'uploadEvidence');
        Route::post('/quotations/{id}/mark-completed', 'markCompleted');
        Route::post('/quotations/{id}/mark-sent', 'markSent');
        
        // Special Creation
        Route::post('/quotations/create-from-pricing', 'createFromPricingRequest');
        Route::post('/quotations/create-from-multiple-pricing', 'createFromMultiplePricingRequests');
    });

    // System Status (PDF)
    Route::get('/system/pdf-status', [QuotationController::class, 'checkPdfStatus']);

    // Invoice APIs
    Route::controller(InvoiceController::class)->group(function () {
        Route::get('/invoices', 'index');
        Route::post('/invoices', 'store');
        Route::get('/invoices/{id}', 'show');
        Route::put('/invoices/{id}', 'update');
        Route::delete('/invoices/{id}', 'destroy');
        
        // Invoice Actions
        Route::post('/invoices/{id}/submit', 'submit');
        Route::post('/invoices/{id}/approve', 'approve');
        Route::post('/invoices/{id}/reject', 'reject');
        Route::post('/invoices/{id}/send-back', 'sendBack');
        
        // Step 2 Workflow APIs
        Route::post('/invoices/{id}/send-to-customer', 'sendToCustomer');
        Route::post('/invoices/{id}/record-payment', 'recordPayment');
        Route::get('/invoices/{id}/payment-history', 'getPaymentHistory');
        Route::post('/invoices/{id}/send-reminder', 'sendReminder');
        Route::get('/invoices/{id}/generate-pdf', 'generatePdf');
        
        // One-Click Conversion
        Route::post('/invoices/create-from-quotation', 'createFromQuotation');
    });

    //---------- Receipt Controller (Step 3) ----------
    Route::controller(\App\Http\Controllers\Api\V1\Accounting\ReceiptController::class)->group(function () {
        // Receipt CRUD
        Route::get('/receipts', 'index');
        Route::get('/receipts/{id}', 'show');
        Route::post('/receipts', 'store');
        Route::put('/receipts/{id}', 'update');
        Route::delete('/receipts/{id}', 'destroy');
        
        // Receipt Actions
        Route::post('/receipts/{id}/submit', 'submit');
        Route::post('/receipts/{id}/approve', 'approve');
        Route::post('/receipts/{id}/reject', 'reject');
        
        // Step 3 Workflow APIs
        Route::post('/receipts/create-from-payment', 'createFromPayment');
        Route::post('/receipts/{id}/upload-evidence', 'uploadEvidence');
        Route::get('/receipts/{id}/generate-pdf', 'generatePdf');
        
        // Receipt Utilities
        Route::get('/receipts/calculate-vat', 'calculateVat');
        Route::get('/receipts/types', 'getReceiptTypes');
        Route::get('/receipts/payment-methods', 'getPaymentMethods');
    });

    //---------- DeliveryNote Controller (Step 4) ----------
    Route::controller(\App\Http\Controllers\Api\V1\Accounting\DeliveryNoteController::class)->group(function () {
        // DeliveryNote CRUD
        Route::get('/delivery-notes', 'index')->name('delivery-notes.index');
        Route::get('/delivery-notes/{id}', 'show')->name('delivery-notes.show');
        Route::post('/delivery-notes', 'store')->name('delivery-notes.store');
        Route::put('/delivery-notes/{id}', 'update')->name('delivery-notes.update');
        Route::delete('/delivery-notes/{id}', 'destroy')->name('delivery-notes.destroy');
        
        // Step 4 Workflow APIs - Create from Receipt
        Route::post('/delivery-notes/create-from-receipt', 'createFromReceipt')->name('delivery-notes.create-from-receipt');
        
        // Step 4 Workflow APIs - Status Management
        Route::post('/delivery-notes/{id}/start-shipping', 'startShipping')->name('delivery-notes.start-shipping');
        Route::post('/delivery-notes/{id}/update-tracking', 'updateTracking')->name('delivery-notes.update-tracking');
        Route::post('/delivery-notes/{id}/mark-delivered', 'markDelivered')->name('delivery-notes.mark-delivered');
        Route::post('/delivery-notes/{id}/mark-completed', 'markCompleted')->name('delivery-notes.mark-completed');
        Route::post('/delivery-notes/{id}/mark-failed', 'markFailed')->name('delivery-notes.mark-failed');
        
        // Step 4 Workflow APIs - Evidence & Documents
        Route::post('/delivery-notes/{id}/upload-evidence', 'uploadEvidence')->name('delivery-notes.upload-evidence');
        Route::get('/delivery-notes/{id}/generate-pdf', 'generatePdf')->name('delivery-notes.generate-pdf');
        Route::get('/delivery-notes/{id}/timeline', 'getTimeline')->name('delivery-notes.timeline');
        
        // DeliveryNote Utilities
        Route::get('/delivery-notes/courier-companies', 'getCourierCompanies')->name('delivery-notes.courier-companies');
        Route::get('/delivery-notes/delivery-methods', 'getDeliveryMethods')->name('delivery-notes.delivery-methods');
        Route::get('/delivery-notes/statuses', 'getDeliveryStatuses')->name('delivery-notes.statuses');
    });
});
