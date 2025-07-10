<?php

namespace Tests\Feature\Api\V1\MaxSupply;

use App\Models\MaxSupply;
use App\Models\User\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class CalendarTest extends TestCase
{
    use RefreshDatabase;
    use WithFaker;
    use MaxSupplyTestSetup;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Set up the required tables for MaxSupply tests
        $this->setUpMaxSupplyTables();

        $this->user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($this->user);

        // Create some max supplies for testing calendar
        $this->createMaxSupplies();
    }

    private function createMaxSupplies()
    {
        // Create max supplies spanning this month
        $currentMonth = now()->startOfMonth();

        // Create some for beginning of month
        MaxSupply::factory()->count(2)->create([
            'start_date' => $currentMonth->copy()->addDays(2),
            'expected_completion_date' => $currentMonth->copy()->addDays(5),
            'status' => 'in_progress',
            'production_type' => 'screen'
        ]);

        // Create some for middle of month
        MaxSupply::factory()->count(3)->create([
            'start_date' => $currentMonth->copy()->addDays(15),
            'expected_completion_date' => $currentMonth->copy()->addDays(20),
            'status' => 'pending',
            'production_type' => 'dtf'
        ]);

        // Create some for end of month
        MaxSupply::factory()->count(1)->create([
            'start_date' => $currentMonth->copy()->addDays(25),
            'expected_completion_date' => $currentMonth->copy()->addDays(28),
            'status' => 'completed',
            'production_type' => 'sublimation'
        ]);
    }

    /** @test */
    public function it_can_get_calendar_data()
    {
        $response = $this->getJson('/api/v1/calendar');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'year',
                    'month',
                    'events',
                    'statistics',
                    'calendar_grid'
                ]
            ]);

        // Check events count
        $this->assertCount(6, $response->json('data.events'));
    }

    /** @test */
    public function it_can_get_monthly_data_by_year_and_month()
    {
        $year = now()->year;
        $month = now()->month;

        $response = $this->getJson("/api/v1/calendar/$year/$month");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'year',
                    'month',
                    'events',
                    'statistics',
                    'calendar_grid'
                ]
            ]);

        // Check year and month match request
        $this->assertEquals($year, $response->json('data.year'));
        $this->assertEquals($month, $response->json('data.month'));
    }

    /** @test */
    public function it_can_get_weekly_data_by_date()
    {
        $date = now()->format('Y-m-d');

        $response = $this->getJson("/api/v1/calendar/week/$date");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'start_date',
                    'end_date',
                    'timeline',
                    'statistics'
                ]
            ]);

        // Timeline should have 7 days
        $this->assertCount(7, $response->json('data.timeline'));
    }

    /** @test */
    public function it_can_get_daily_data_by_date()
    {
        $date = now()->format('Y-m-d');

        $response = $this->getJson("/api/v1/calendar/day/$date");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'date',
                    'events',
                    'time_slots',
                    'statistics'
                ]
            ]);

        // Check date matches request
        $this->assertEquals($date, $response->json('data.date'));
    }
}
