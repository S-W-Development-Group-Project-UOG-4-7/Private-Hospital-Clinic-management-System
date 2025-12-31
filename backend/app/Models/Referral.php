<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Referral extends Model
{
    use HasFactory;

    protected $fillable = [
        'referral_number',
        'patient_id',
        'referring_doctor_id',
        'referred_doctor_id',
        'specialty',
        'status',
        'reason',
        'clinical_summary',
        'notes',
        'referral_date',
        'appointment_date',
        'accepted_at',
        'completed_at',
    ];

    protected $casts = [
        'referral_date' => 'date',
        'appointment_date' => 'date',
        'accepted_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function referringDoctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referring_doctor_id');
    }

    public function referredDoctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_doctor_id');
    }
}

