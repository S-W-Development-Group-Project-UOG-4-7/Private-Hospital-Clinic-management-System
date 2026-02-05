<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'provider',
        'room_id',
        'join_url_patient',
        'join_url_doctor',
        'status',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }
}
