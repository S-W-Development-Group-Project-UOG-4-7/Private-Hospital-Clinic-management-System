<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Slot extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'date',
        'start_time',
        'end_time',
        'allowed_visit_mode',
        'status',
        'held_until',
        'held_by_patient_id',
    ];

    protected $casts = [
        'date' => 'date',
        'held_until' => 'datetime',
    ];

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function heldByPatient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'held_by_patient_id');
    }

    public function isHoldExpired(): bool
    {
        if ($this->status !== 'HELD') {
            return false;
        }

        if (! $this->held_until) {
            return true;
        }

        return CarbonImmutable::parse($this->held_until)->isPast();
    }
}
