<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AddSupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            [
                'name' => 'PharmaCorp International',
                'contact_person' => 'John Smith',
                'email' => 'john@pharmacorp.com',
                'phone' => '+1-555-0101',
                'address' => '123 Medical Supply Lane, Pharma City, PC 12345',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'MediTech Supplies',
                'contact_person' => 'Jane Doe',
                'email' => 'jane@meditech.com',
                'phone' => '+1-555-0102',
                'address' => '456 Health Boulevard, Medicine Town, MT 67890',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($suppliers as $supplier) {
            DB::table('suppliers')->updateOrInsert(
                ['name' => $supplier['name']],
                $supplier
            );
        }

        $this->command->info('Added 2 suppliers for inventory testing');
    }
}
