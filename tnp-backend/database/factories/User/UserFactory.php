<?php

namespace Database\Factories\User;

use App\Models\User\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User\User>
 */
class UserFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = User::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $firstname = fake()->firstName();
        $lastname = fake()->lastName();
        $username = strtolower($firstname . '.' . $lastname);

        return [
            'user_id' => fake()->numberBetween(1000, 9999),
            'user_uuid' => Str::uuid(),
            'username' => $username,
            'password' => Hash::make('password'),
            'role' => fake()->randomElement(['admin', 'manager', 'sale', 'production']),
            'user_emp_no' => 'EMP' . fake()->numberBetween(1000, 9999),
            'user_firstname' => $firstname,
            'user_lastname' => $lastname,
            'user_phone' => fake()->phoneNumber(),
            'user_nickname' => strtolower(substr($firstname, 0, 3)),
            'user_position' => fake()->jobTitle(),
            'enable' => 'Y',
            'user_is_enable' => true,
            'deleted' => 0,
            'user_is_deleted' => false,
        ];
    }

    /**
     * Indicate that the user is an admin.
     */
    public function admin(): self
    {
        return $this->state(function (array $attributes) {
            return [
                'role' => 'admin',
            ];
        });
    }

    /**
     * Indicate that the user is a manager.
     */
    public function manager(): self
    {
        return $this->state(function (array $attributes) {
            return [
                'role' => 'manager',
            ];
        });
    }

    /**
     * Indicate that the user is a sales.
     */
    public function sales(): self
    {
        return $this->state(function (array $attributes) {
            return [
                'role' => 'sale',
            ];
        });
    }

    /**
     * Indicate that the user is from production.
     */
    public function production(): self
    {
        return $this->state(function (array $attributes) {
            return [
                'role' => 'production',
            ];
        });
    }
}
