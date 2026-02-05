<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\StockLedger;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PharmacyDispenseTest extends TestCase
{
    use RefreshDatabase;

    public function test_dispense_cannot_make_stock_negative(): void
    {
        Role::findOrCreate('pharmacist', 'web');
        Role::findOrCreate('patient', 'web');

        $pharmacist = User::factory()->create();
        $pharmacist->assignRole('pharmacist');

        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $inventory = InventoryItem::create([
            'name' => 'Test Drug',
            'unit' => 'tablet',
            'quantity' => 2,
            'reorder_level' => 0,
            'unit_price' => 10,
            'selling_price' => 12,
            'is_active' => true,
        ]);

        $prescription = Prescription::create([
            'prescription_number' => 'RX-TEST-1',
            'patient_id' => $patient->id,
            'prescription_date' => now()->toDateString(),
            'status' => 'pending',
        ]);

        PrescriptionItem::create([
            'prescription_id' => $prescription->id,
            'inventory_item_id' => $inventory->id,
            'quantity' => 5,
            'unit_price' => 12,
            'total_price' => 60,
            'is_dispensed' => false,
        ]);

        $response = $this->actingAs($pharmacist, 'sanctum')
            ->postJson("/api/pharmacist/prescriptions/{$prescription->id}/dispense", []);

        $response->assertStatus(400);
        $this->assertDatabaseHas('inventory_items', [
            'id' => $inventory->id,
            'quantity' => 2,
        ]);
    }

    public function test_partial_dispense_updates_remaining_and_ledger(): void
    {
        Role::findOrCreate('pharmacist', 'web');
        Role::findOrCreate('patient', 'web');

        $pharmacist = User::factory()->create();
        $pharmacist->assignRole('pharmacist');

        $patient = User::factory()->create();
        $patient->assignRole('patient');

        $inventory = InventoryItem::create([
            'name' => 'Test Drug',
            'unit' => 'tablet',
            'quantity' => 6,
            'reorder_level' => 0,
            'unit_price' => 10,
            'selling_price' => 12,
            'is_active' => true,
        ]);

        $prescription = Prescription::create([
            'prescription_number' => 'RX-TEST-2',
            'patient_id' => $patient->id,
            'prescription_date' => now()->toDateString(),
            'status' => 'pending',
        ]);

        $item = PrescriptionItem::create([
            'prescription_id' => $prescription->id,
            'inventory_item_id' => $inventory->id,
            'quantity' => 10,
            'unit_price' => 12,
            'total_price' => 120,
            'is_dispensed' => false,
        ]);

        $response = $this->actingAs($pharmacist, 'sanctum')
            ->postJson("/api/pharmacist/prescriptions/{$prescription->id}/dispense", [
                'items' => [
                    ['id' => $item->id, 'quantity' => 6],
                ],
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('prescriptions', [
            'id' => $prescription->id,
            'status' => 'partial',
        ]);

        $this->assertDatabaseHas('prescription_items', [
            'id' => $item->id,
            'dispensed_quantity' => 6,
        ]);

        $this->assertDatabaseHas('inventory_items', [
            'id' => $inventory->id,
            'quantity' => 0,
        ]);

        $this->assertDatabaseHas('stock_ledgers', [
            'inventory_item_id' => $inventory->id,
            'type' => 'DISPENSE',
            'quantity' => -6,
        ]);
    }
}
