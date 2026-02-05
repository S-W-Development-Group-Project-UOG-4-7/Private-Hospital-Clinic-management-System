<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Clinic;
use App\Models\Department;

class Referral extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'referred_by_doctor_id',
        'referred_to_doctor_id',
        'to_department_id',
        'clinic_id',
        'type',
        'external_provider',
        'reason',
        'status',
        'referred_at',
        'notes',
        'report_url',
        'created_by',
    ];

    protected $casts = [
        'referred_at' => 'date',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function referredByDoctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by_doctor_id');
    }

    public function referredToDoctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_to_doctor_id');
    }

    public function toDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'to_department_id');
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
