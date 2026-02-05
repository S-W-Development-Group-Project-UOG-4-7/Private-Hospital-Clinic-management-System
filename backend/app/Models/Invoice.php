<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'patient_id',
        'amount',
        'status',
        'issued_at',
        'due_date',
        'description',
    ];

    protected $casts = [
        'issued_at' => 'date',
        'due_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function totalFromItems(?Collection $items = null): float
    {
        $items = $items ?? $this->items;

        return (float) $items->sum(function (InvoiceItem $item) {
            return (float) $item->line_total;
        });
    }
}
