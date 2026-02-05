<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
    ];

    /**
     * Relationship: Department has many users
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Relationship: Department has many doctors
     */
    public function doctors(): HasMany
    {
        return $this->hasMany(User::class)->role('doctor');
    }

    /**
     * Get the count of users in this department
     */
    public function getUsersCountAttribute(): int
    {
        return $this->users()->count();
    }

    /**
     * Get the count of doctors in this department
     */
    public function getDoctorsCountAttribute(): int
    {
        return $this->doctors()->count();
    }

    /**
     * Scope to get departments with users
     */
    public function scopeWithUsers($query)
    {
        return $query->withCount('users');
    }

    /**
     * Scope to get departments with doctors
     */
    public function scopeWithDoctors($query)
    {
        return $query->withCount(['users' => function ($query) {
            $query->role('doctor');
        }]);
    }
}