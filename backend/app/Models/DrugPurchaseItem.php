<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DrugPurchaseItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'drug_purchase_id',
        'inventory_item_id',
        'quantity',
        'unit_price',
        'total_price',
        'expiry_date',
        'batch_number',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'expiry_date' => 'date',
    ];

    public function drugPurchase(): BelongsTo
    {
        return $this->belongsTo(DrugPurchase::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }
}

