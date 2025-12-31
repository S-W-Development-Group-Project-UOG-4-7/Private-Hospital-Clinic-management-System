<?php

namespace App\Models;

<<<<<<< Updated upstream
=======
use Illuminate\Database\Eloquent\Factories\HasFactory;
>>>>>>> Stashed changes
use Illuminate\Database\Eloquent\Model;

class Ward extends Model
{
<<<<<<< Updated upstream
    //
}
=======
    use HasFactory;

    protected $fillable = ['name', 'type', 'capacity'];

    // This is the part that might be missing or broken
    public function beds()
    {
        return $this->hasMany(Bed::class);
    }
}
>>>>>>> Stashed changes
