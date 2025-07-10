<?php

namespace Tests\Feature\Api\V1\MaxSupply;

use App\Models\MaxSupply;
use App\Models\User\User;
use App\Models\Worksheet\Worksheet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class MaxSupplyUpdateTest extends TestCase
{
    use RefreshDatabase;
    use WithFaker;
    use MaxSupplyTestSetup;

    protected User $user;
    protected Worksheet $worksheet;
    protected MaxSupply $maxSupply;

    protected function setUp(): void
    {
        parent::setUp();

        // Set up the required tables for MaxSupply tests
        $this->setUpMaxSupplyTables();

        $this->user = User::factory()->create(['role' => 'admin']);
        $this->worksheet = Worksheet::factory()->create();

        // Create a max supply for testing
        $this->maxSupply = MaxSupply::factory()->create([
            'worksheet_id' => $this->worksheet->worksheet_id,
            'title' => 'Original Title',
            'production_type' => 'screen',
            'status' => 'pending',
            'priority' => 'normal'
        ]);

        $this->actingAs($this->user);
    }

    /** @test */
    public function it_can_update_a_max_supply()
    {
        $data = [
            'title' => 'Updated Max Supply Title',
            'production_type' => 'dtf',
            'priority' => 'high',
            'notes' => 'Updated notes'
        ];

        $response = $this->putJson("/api/v1/max-supplies/{$this->maxSupply->id}", $data);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'production_type',
                    'priority',
                    'notes'
                ]
            ]);

        // Check if data was updated correctly
        $this->assertEquals('Updated Max Supply Title', $response->json('data.title'));
        $this->assertEquals('dtf', $response->json('data.production_type'));
        $this->assertEquals('high', $response->json('data.priority'));

        // Check database
        $this->assertDatabaseHas('max_supplies', [
            'id' => $this->maxSupply->id,
            'title' => 'Updated Max Supply Title',
            'production_type' => 'dtf',
            'priority' => 'high',
            'notes' => 'Updated notes'
        ]);
    }

    /** @test */
    public function it_can_update_status_of_max_supply()
    {
        $data = [
            'status' => 'in_progress',
            'completed_quantity' => 50
        ];

        $response = $this->patchJson("/api/v1/max-supplies/{$this->maxSupply->id}/status", $data);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'status',
                    'completed_quantity'
                ]
            ]);

        // Check if status was updated correctly
        $this->assertEquals('in_progress', $response->json('data.status'));
        $this->assertEquals(50, $response->json('data.completed_quantity'));

        // Check database
        $this->assertDatabaseHas('max_supplies', [
            'id' => $this->maxSupply->id,
            'status' => 'in_progress',
            'completed_quantity' => 50
        ]);
    }

    /** @test */
    public function it_can_complete_a_max_supply()
    {
        $data = [
            'status' => 'completed'
        ];

        $response = $this->patchJson("/api/v1/max-supplies/{$this->maxSupply->id}/status", $data);

        $response->assertStatus(200);

        // Check if it's marked as completed
        $this->assertEquals('completed', $response->json('data.status'));

        // Completed date should be set
        $this->assertNotNull($response->json('data.actual_completion_date'));

        // Completed quantity should equal total quantity
        $this->assertEquals(
            $response->json('data.total_quantity'),
            $response->json('data.completed_quantity')
        );
    }

    /** @test */
    public function it_can_delete_a_max_supply()
    {
        $response = $this->deleteJson("/api/v1/max-supplies/{$this->maxSupply->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'งานถูกลบเรียบร้อยแล้ว'
            ]);

        // Check that it's removed from database
        $this->assertDatabaseMissing('max_supplies', [
            'id' => $this->maxSupply->id,
            'deleted_at' => null
        ]);
    }
}
