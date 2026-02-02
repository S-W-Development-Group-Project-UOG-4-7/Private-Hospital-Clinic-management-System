<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use App\Models\Role;
use App\Models\PatientProfile;
use App\Models\Prescription;
use App\Models\ClinicReferral;
use App\Models\Clinic;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'username',
        'email',
        'password',
        'is_active',
        'clinic_id',
        'department_id',
        'role_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    // ==========================================
    // RELATIONSHIPS
    // ==========================================

    /**
     * Get the department associated with the user.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * RENAMED: 'legacyRole' to prevent conflict with scopeRole()
     * Get the role associated with the user (legacy role_id column).
     */
    public function legacyRole(): BelongsTo
    {
        return $this->belongsTo(\Spatie\Permission\Models\Role::class, 'role_id');
    }

    /**
     * Get the patient profile associated with the user.
     */
    public function patientProfile(): HasOne
    {
        return $this->hasOne(PatientProfile::class, 'user_id');
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class, 'patient_id');
    }

    public function clinicReferrals(): HasMany
    {
        return $this->hasMany(ClinicReferral::class, 'patient_id');
    }

    /**
     * Get the clinic associated with the user.
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class, 'clinic_id');
    }

    // ==========================================
    // SCOPES
    // ==========================================

    /**
     * Scope users by role(s)
     * Supports single role string or array of roles
     */
    public function scopeRole($query, $roles = null)
    {
        // Handle empty/null roles - return query unchanged
        if (empty($roles)) {
            return $query;
        }

        // Handle array of roles
        if (is_array($roles)) {
            return $query->whereHas('roles', function ($q) use ($roles) {
                $q->whereIn('name', $roles);
            });
        }

        // Handle single role
        return $query->whereHas('roles', function ($q) use ($roles) {
            $q->where('name', $roles);
        });
    }

    // ==========================================
    // ACCESSORS
    // ==========================================

    /**
     * Get prescriptions where the user is the patient.
     */
    public function prescriptionsAsPatient(): HasMany
    {
        return $this->hasMany(Prescription::class, 'patient_id');
    }

    /**
     * Virtual Attribute: 'name'
     * Allows you to call $user->name even though the column doesn't exist.
     */
    public function getNameAttribute(): string
    {
        // If the database actually HAS a name column (legacy), use it.
        if (isset($this->attributes['name']) && $this->attributes['name'] !== null) {
            return (string) $this->attributes['name'];
        }

        // Otherwise, combine first and last name
        $full = trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? ''));

        // If both are empty, fall back to username
        return $full === '' ? ($this->username ?? 'User') : $full;
    }
}
