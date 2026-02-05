<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DrugPurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_number',
        'supplier_id',
        'purchased_by',
        'purchase_date',
        'expected_delivery_date',
        'status',
        'subtotal',
        'tax',
        'discount',
        'total_amount',
        'notes',
        'received_at',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'expected_delivery_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'discount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'received_at' => 'datetime',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function purchaser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'purchased_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(DrugPurchaseItem::class, 'drug_purchase_id');
    }
}

