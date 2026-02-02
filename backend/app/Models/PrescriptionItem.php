<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Services\MedicationQuantityCalculator;

class PrescriptionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'prescription_id',
        'inventory_item_id',
        'quantity',
        'dosage',
        'frequency',
        'meal_timing',
        'duration_days',
        'instructions',
        'unit_price',
        'total_price',
        'is_dispensed',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'duration_days' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'is_dispensed' => 'boolean',
    ];

    protected $appends = [
        'calculated_quantity',
    ];

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function getCalculatedQuantityAttribute(): int
    {
        return MedicationQuantityCalculator::fromPrescriptionItem($this);
    }
}

