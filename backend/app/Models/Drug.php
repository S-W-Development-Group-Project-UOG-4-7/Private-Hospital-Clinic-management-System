<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Drug extends Model
{
    use HasFactory;

    // This allows these specific columns to be written to by the controller
    protected $fillable = [
        'name',
        'stock_quantity',
        'expiry_date',
        'status',
    ];
}