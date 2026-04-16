<?php

namespace Tests\Feature\Api\V1;

use App\Http\Controllers\Api\V1\Accounting\DeliveryNoteController;
use App\Http\Controllers\Api\V1\Accounting\ReceiptController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AccountingRouteOrderTest extends TestCase
{
    public function test_receipt_vat_utility_route_is_not_shadowed_by_receipt_id_route(): void
    {
        $route = Route::getRoutes()->match(Request::create('/api/v1/receipts/calculate-vat', 'GET'));

        $this->assertSame(ReceiptController::class . '@calculateVat', $route->getActionName());
    }

    public function test_delivery_note_courier_utility_route_is_not_shadowed_by_delivery_note_id_route(): void
    {
        $route = Route::getRoutes()->match(Request::create('/api/v1/delivery-notes/courier-companies', 'GET'));

        $this->assertSame(DeliveryNoteController::class . '@getCourierCompanies', $route->getActionName());
    }

    public function test_delivery_note_method_utility_route_is_not_shadowed_by_delivery_note_id_route(): void
    {
        $route = Route::getRoutes()->match(Request::create('/api/v1/delivery-notes/delivery-methods', 'GET'));

        $this->assertSame(DeliveryNoteController::class . '@getDeliveryMethods', $route->getActionName());
    }
}
