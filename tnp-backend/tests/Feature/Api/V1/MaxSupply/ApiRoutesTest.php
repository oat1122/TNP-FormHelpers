<?php

namespace Tests\Feature\Api\V1\MaxSupply;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;

class ApiRoutesTest extends TestCase
{
    use RefreshDatabase;
    use MaxSupplyTestSetup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpMaxSupplyTables();
    }
    /** @test */
    public function it_has_maxsupply_routes_defined()
    {
        $routes = [
            // MaxSupply routes
            ['GET', 'api/v1/max-supplies'],
            ['POST', 'api/v1/max-supplies'],
            ['GET', 'api/v1/max-supplies/{id}'],
            ['PUT', 'api/v1/max-supplies/{id}'],
            ['DELETE', 'api/v1/max-supplies/{id}'],
            ['PATCH', 'api/v1/max-supplies/{id}/status'],

            // Calendar routes
            ['GET', 'api/v1/calendar'],
            ['GET', 'api/v1/calendar/{year}/{month}'],
            ['GET', 'api/v1/calendar/week/{date}'],
        ];

        $definedRoutes = collect(Route::getRoutes())->map(function ($route) {
            return [
                $route->methods()[0],
                $route->uri()
            ];
        });

        foreach ($routes as $route) {
            $this->assertTrue(
                $definedRoutes->contains(function ($definedRoute) use ($route) {
                    return $definedRoute[0] === $route[0] &&
                           str_contains($definedRoute[1], $route[1]);
                }),
                "Route {$route[0]} {$route[1]} is not defined."
            );
        }
    }
}
