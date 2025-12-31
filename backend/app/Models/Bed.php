<?php

namespace App\Models;

<<<<<<< Updated upstream
=======
use Illuminate\Database\Eloquent\Factories\HasFactory;
>>>>>>> Stashed changes
use Illuminate\Database\Eloquent\Model;

class Bed extends Model
{
<<<<<<< Updated upstream
    //
}
=======
    use HasFactory;

    // IMPORTANT: This must match your database column exactly
    protected $fillable = ['ward_id', 'bed_number', 'is_available'];

    public function ward()
    {
        return $this->belongsTo(Ward::class);
    }
}
>>>>>>> Stashed changes
