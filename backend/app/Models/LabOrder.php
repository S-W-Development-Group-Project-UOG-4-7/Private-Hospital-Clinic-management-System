<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LabOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'patient_id',
        'doctor_id',
        'appointment_id',
        'test_type',
        'test_description',
        'status',
        'order_date',
        'due_date',
        'notes',
        'instructions',
    ];

    protected $casts = [
        'order_date' => 'date',
        'due_date' => 'date',
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

    public function results(): HasMany
    {
        return $this->hasMany(LabResult::class);
    }
}

