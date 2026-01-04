<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'phone',
        'date_of_birth',
        'gender',
        'address',
        'blood_type',
        'city',
        'state',
        'postal_code',
        'guardian_name',
        'guardian_email',
        'guardian_phone',
        'guardian_relationship',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
