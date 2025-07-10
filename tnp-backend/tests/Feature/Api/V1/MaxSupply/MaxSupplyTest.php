<?php

namespace Tests\Feature\Api\V1\MaxSupply;

use App\Models\MaxSupply;
use App\Models\User\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class MaxSupplyTest extends TestCase
{
    use RefreshDatabase;
    use WithFaker;
    use MaxSupplyTestSetup;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Set up the required tables for MaxSupply tests
        $this->setUpMaxSupplyTables();

        $this->user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($this->user);
    }

    /** @test */
    public function it_can_get_a_list_of_max_supplies()
    {
        // Create test data
        MaxSupply::factory()->count(5)->create();

        // Test API endpoint
        $response = $this->getJson('/api/v1/max-supplies');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'data' => [
                        '*' => [
                            'id',
                            'code',
                            'worksheet_id',
                            'title',
                            'customer_name',
                            'production_type',
                            'production_type_label',
                            'start_date',
                            'expected_completion_date',
                            'due_date',
                            'status',
                            'status_label',
                            'priority',
                            'priority_label',
                        ]
                    ],
                    'current_page',
                    'per_page',
                    'total'
                ]
            ]);
    }

    /** @test */
    public function it_can_filter_max_supplies_by_production_type()
    {
        // Create test data with different production types
        MaxSupply::factory()->count(3)->create(['production_type' => 'screen']);
        MaxSupply::factory()->count(2)->create(['production_type' => 'dtf']);

        // Test API endpoint with filter
        $response = $this->getJson('/api/v1/max-supplies?production_type=screen');

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 3);

        // Only screen production type should be returned
        $response->assertJsonCount(3, 'data.data');
        $this->assertEquals('screen', $response->json('data.data.0.production_type'));
    }

    /** @test */
    public function it_can_filter_max_supplies_by_status()
    {
        // Create test data with different statuses
        MaxSupply::factory()->count(2)->create(['status' => 'pending']);
        MaxSupply::factory()->count(2)->create(['status' => 'in_progress']);
        MaxSupply::factory()->count(1)->create(['status' => 'completed']);

        // Test API endpoint with filter
        $response = $this->getJson('/api/v1/max-supplies?status=in_progress');

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 2);

        // Only in_progress status should be returned
        $response->assertJsonCount(2, 'data.data');
        $this->assertEquals('in_progress', $response->json('data.data.0.status'));
    }

    /** @test */
    public function it_can_search_max_supplies_by_title_or_customer()
    {
        // Create test data
        MaxSupply::factory()->create([
            'title' => 'Special T-Shirt Order',
            'customer_name' => 'ABC Company'
        ]);

        MaxSupply::factory()->create([
            'title' => 'Regular Polo Order',
            'customer_name' => 'XYZ Corporation'
        ]);

        // Test search by title
        $response = $this->getJson('/api/v1/max-supplies?search=Special');
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data');

        // Test search by customer
        $response = $this->getJson('/api/v1/max-supplies?search=XYZ');
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data');
    }
}
