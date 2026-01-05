<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VitalSign extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'appointment_id',
        'blood_pressure_systolic',
        'blood_pressure_diastolic',
        'heart_rate',
        'temperature',
        'weight',
        'height',
        'respiratory_rate',
        'oxygen_saturation',
        'symptoms',
        'notes',
        'recorded_at',
    ];

    protected $casts = [
        'blood_pressure_systolic' => 'decimal:2',
        'blood_pressure_diastolic' => 'decimal:2',
        'temperature' => 'decimal:2',
        'weight' => 'decimal:2',
        'height' => 'decimal:2',
        'oxygen_saturation' => 'decimal:2',
        'recorded_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }
}

