<?php

namespace Tests\Feature\Api\V1\MaxSupply;

use App\Models\MaxSupply;
use App\Models\User\User;
use App\Models\Worksheet\Worksheet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class MaxSupplyCreateTest extends TestCase
{
    use RefreshDatabase;
    use WithFaker;
    use MaxSupplyTestSetup;

    protected User $user;
    protected Worksheet $worksheet;

    protected function setUp(): void
    {
        parent::setUp();

        // Set up the required tables for MaxSupply tests
        $this->setUpMaxSupplyTables();

        $this->user = User::factory()->create(['role' => 'admin']);
        $this->worksheet = Worksheet::factory()->create();
        $this->actingAs($this->user);
    }

    /** @test */
    public function it_can_create_a_new_max_supply()
    {
        $data = [
            'worksheet_id' => $this->worksheet->worksheet_id,
            'title' => 'New Test Max Supply',
            'production_type' => 'screen',
            'start_date' => now()->format('Y-m-d'),
            'expected_completion_date' => now()->addDays(5)->format('Y-m-d'),
            'priority' => 'high',
            'sizes' => [
                'S' => 50,
                'M' => 100,
                'L' => 75
            ],
            'notes' => 'Test notes',
            'special_instructions' => 'Handle with care'
        ];

        $response = $this->postJson('/api/v1/max-supplies', $data);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'code',
                    'worksheet_id',
                    'title',
                    'customer_name',
                    'production_type',
                    'start_date',
                    'expected_completion_date',
                    'due_date',
                    'status',
                    'priority',
                    'sizes',
                    'notes',
                    'special_instructions'
                ]
            ]);

        // Check if data was saved correctly
        $this->assertEquals('New Test Max Supply', $response->json('data.title'));
        $this->assertEquals('screen', $response->json('data.production_type'));
        $this->assertEquals('high', $response->json('data.priority'));

        // Check database
        $this->assertDatabaseHas('max_supplies', [
            'title' => 'New Test Max Supply',
            'production_type' => 'screen',
            'priority' => 'high'
        ]);
    }

    /** @test */
    public function it_validates_required_fields_when_creating_max_supply()
    {
        $data = [
            // Missing worksheet_id and other required fields
            'title' => 'Invalid Max Supply',
        ];

        $response = $this->postJson('/api/v1/max-supplies', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['worksheet_id', 'production_type', 'expected_completion_date']);
    }

    /** @test */
    public function it_can_get_a_single_max_supply_by_id()
    {
        $maxSupply = MaxSupply::factory()->create([
            'worksheet_id' => $this->worksheet->worksheet_id,
        ]);

        $response = $this->getJson("/api/v1/max-supplies/{$maxSupply->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'code',
                    'worksheet_id',
                    'title',
                    'customer_name',
                    'production_type',
                    'start_date',
                    'expected_completion_date',
                    'due_date',
                    'status',
                    'priority',
                ]
            ])
            ->assertJsonPath('data.id', $maxSupply->id);
    }

    /** @test */
    public function it_returns_404_when_max_supply_not_found()
    {
        $response = $this->getJson('/api/v1/max-supplies/999999');
        $response->assertStatus(404);
    }
}
