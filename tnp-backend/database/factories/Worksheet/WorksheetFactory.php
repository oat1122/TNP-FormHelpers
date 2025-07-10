<?php

namespace Database\Factories\Worksheet;

use App\Models\Worksheet\Worksheet;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Worksheet\Worksheet>
 */
class WorksheetFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Worksheet::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user = User::factory()->create();

        return [
            'worksheet_id' => Str::uuid(),
            'work_id' => 'WS-' . date('Ymd') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT),
            'customer_id' => Str::uuid(),
            'pattern_id' => Str::uuid(),
            'user_id' => $user->user_uuid,
            'work_name' => fake()->sentence(3),
            'total_quantity' => fake()->numberBetween(50, 500),
            'due_date' => fake()->dateTimeBetween('+1 week', '+4 weeks'),
            'exam_date' => fake()->dateTimeBetween('now', '+1 week'),
            'date_created' => now(),
            'creator_name' => $user->user_firstname . ' ' . $user->user_lastname,
        ];
    }
}
