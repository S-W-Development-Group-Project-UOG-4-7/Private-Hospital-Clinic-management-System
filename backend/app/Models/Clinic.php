<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Clinic extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'location',
        'department_type',
    ];

    public function doctors(): HasMany
    {
        return $this->hasMany(User::class, 'clinic_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'clinic_id');
    }
}
