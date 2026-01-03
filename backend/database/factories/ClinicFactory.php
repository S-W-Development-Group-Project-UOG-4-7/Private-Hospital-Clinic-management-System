<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Clinic>
 */
class ClinicFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->company() . ' Clinic',
            'location' => $this->faker->city(),
            'department_type' => $this->faker->randomElement(['OPD', 'Inpatient', 'Surgery']),
        ];
    }
}
