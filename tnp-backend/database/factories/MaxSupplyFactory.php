<?php

namespace Database\Factories;

use App\Models\MaxSupply;
use App\Models\Worksheet\Worksheet;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MaxSupply>
 */
class MaxSupplyFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = MaxSupply::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Get or create a worksheet
        $worksheet = Worksheet::factory()->create();

        // Get or create a user
        $user = User::factory()->create();

        $startDate = fake()->dateTimeBetween('now', '+2 weeks');
        $expectedCompletionDate = fake()->dateTimeBetween(
            $startDate,
            date('Y-m-d', strtotime('+3 weeks', $startDate->getTimestamp()))
        );
        $dueDate = fake()->dateTimeBetween(
            $expectedCompletionDate,
            date('Y-m-d', strtotime('+1 week', $expectedCompletionDate->getTimestamp()))
        );

        $totalQuantity = fake()->numberBetween(50, 500);
        $completedQuantity = fake()->numberBetween(0, $totalQuantity);

        $shirtType = fake()->randomElement(['polo', 't-shirt', 'hoodie', 'tank-top']);
        $productionType = fake()->randomElement(['screen', 'dtf', 'sublimation']);

        // Generate a code like "MS-20250710-001"
        $code = 'MS-' . date('Ymd') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);

        // Generate random sizes
        $sizes = [
            'S' => fake()->numberBetween(10, 100),
            'M' => fake()->numberBetween(10, 100),
            'L' => fake()->numberBetween(10, 100),
            'XL' => fake()->numberBetween(10, 100),
        ];

        return [
            'code' => $code,
            'worksheet_id' => $worksheet->worksheet_id,
            'title' => fake()->sentence(4),
            'customer_name' => fake()->company(),
            'production_type' => $productionType,
            'start_date' => $startDate,
            'expected_completion_date' => $expectedCompletionDate,
            'due_date' => $dueDate,
            'actual_completion_date' => null,
            'status' => fake()->randomElement(['pending', 'in_progress', 'completed', 'cancelled']),
            'priority' => fake()->randomElement(['low', 'normal', 'high', 'urgent']),
            'shirt_type' => $shirtType,
            'total_quantity' => $totalQuantity,
            'completed_quantity' => $completedQuantity,
            'sizes' => $sizes,
            'screen_points' => fake()->numberBetween(0, 10),
            'dtf_points' => fake()->numberBetween(0, 10),
            'sublimation_points' => fake()->numberBetween(0, 10),
            'notes' => fake()->paragraph(),
            'special_instructions' => fake()->paragraph(),
            'created_by' => $user->user_id,
            'updated_by' => $user->user_id,
        ];
    }

    /**
     * Indicate that the max supply is pending.
     */
    public function pending(): self
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'pending',
                'completed_quantity' => 0,
            ];
        });
    }

    /**
     * Indicate that the max supply is in progress.
     */
    public function inProgress(): self
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'in_progress',
                'completed_quantity' => rand(1, $attributes['total_quantity'] - 1),
            ];
        });
    }

    /**
     * Indicate that the max supply is completed.
     */
    public function completed(): self
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'completed',
                'completed_quantity' => $attributes['total_quantity'],
                'actual_completion_date' => now(),
            ];
        });
    }
}
