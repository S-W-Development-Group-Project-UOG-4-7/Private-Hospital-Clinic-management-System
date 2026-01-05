<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CdsRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'rule_type',
        'rule_name',
        'description',
        'conditions',
        'severity',
        'warning_message',
        'is_active',
    ];

    protected $casts = [
        'conditions' => 'array',
        'is_active' => 'boolean',
    ];
}

