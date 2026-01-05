<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LabResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'lab_order_id',
        'patient_id',
        'doctor_id',
        'test_name',
        'result_value',
        'unit',
        'reference_range',
        'status',
        'interpretation',
        'file_url',
        'result_date',
        'doctor_reviewed',
        'reviewed_at',
        'doctor_notes',
    ];

    protected $casts = [
        'result_date' => 'date',
        'doctor_reviewed' => 'boolean',
        'reviewed_at' => 'datetime',
    ];

    public function labOrder(): BelongsTo
    {
        return $this->belongsTo(LabOrder::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }
}

