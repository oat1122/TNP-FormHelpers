<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Customer>
 */
class CustomerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'customer_id' => $this->faker->unique()->iban('TH'),
            'customer_name' => $this->faker->name(),
            'company_name' => $this->faker->company(),
            'customer_address' => $this->faker->streetAddress(),
            'customer_tel' => $this->faker->phoneNumber(),
            'customer_email' => $this->faker->companyEmail(),
            'customer_tax_id' => $this->faker->randomNumber(),
        ];
    }
}
