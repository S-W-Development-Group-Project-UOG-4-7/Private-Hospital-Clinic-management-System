<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientFeedback extends Model
{
    use HasFactory;

    protected $table = 'patient_feedback';

    protected $fillable = [
        'patient_id',
        'subject',
        'message',
        'rating',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }
}
