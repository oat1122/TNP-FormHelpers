<?php

namespace Tests\Unit\MaxSupply;

use App\Models\MaxSupply;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Mockery;
use App\Models\Worksheet\Worksheet;

class MaxSupplyTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_create_a_max_supply_with_mocked_worksheet()
    {
        // Mock the Worksheet model to avoid database dependencies
        $worksheet = Mockery::mock(Worksheet::class);
        $worksheet->shouldReceive('getAttribute')->with('worksheet_id')->andReturn('mock-worksheet-id');

        // Create a MaxSupply without hitting the database
        $maxSupply = new MaxSupply([
            'code' => 'MAX-001',
            'worksheet_id' => 'mock-worksheet-id',
            'title' => 'Test Max Supply',
            'customer_name' => 'Test Customer',
            'production_type' => 'screen',
            'status' => 'pending',
            'priority' => 'normal',
        ]);

        // Verify the properties
        $this->assertEquals('MAX-001', $maxSupply->code);
        $this->assertEquals('mock-worksheet-id', $maxSupply->worksheet_id);
        $this->assertEquals('Test Max Supply', $maxSupply->title);
    }

    /** @test */
    public function max_supply_has_expected_fillable_attributes()
    {
        // Test that the model has the expected fillable attributes
        $expectedFillable = [
            'code',
            'worksheet_id',
            'title',
            'customer_name',
            'production_type',
            'start_date',
            'expected_completion_date',
            'due_date',
            'actual_completion_date',
            'status',
            'priority',
            'shirt_type',
            'total_quantity',
            'completed_quantity',
            'sizes',
            'screen_points',
            'dtf_points',
            'sublimation_points',
            'notes',
            'special_instructions',
            'created_by',
            'updated_by',
        ];

        $model = new MaxSupply();
        $this->assertEquals($expectedFillable, $model->getFillable());
    }
}
