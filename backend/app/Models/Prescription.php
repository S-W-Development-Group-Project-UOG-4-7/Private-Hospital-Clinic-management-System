<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prescription extends Model
{
    use HasFactory;

    protected $fillable = [
        'prescription_number',
        'patient_id',
        'doctor_id',
        'clinic_id',
        'appointment_id',
        'pharmacist_id',
        'prescription_date',
        'status',
        'notes',
        'instructions',
        'dispensed_at',
        'root_prescription_id',
        'previous_prescription_id',
        'version',
    ];

    protected $casts = [
        'prescription_date' => 'date',
        'dispensed_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function pharmacist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pharmacist_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PrescriptionItem::class);
    }

    public function rootPrescription(): BelongsTo
    {
        return $this->belongsTo(self::class, 'root_prescription_id');
    }

    public function previousPrescription(): BelongsTo
    {
        return $this->belongsTo(self::class, 'previous_prescription_id');
    }

    public function getTotalAmountAttribute(): float
    {
        return $this->items->sum('total_price');
    }
}
