<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    use HasFactory;

    public const VISIT_MODE_PHYSICAL = 'PHYSICAL';
    public const VISIT_MODE_ONLINE = 'ONLINE';

    public const BOOKING_CHANNEL_FRONTDESK = 'FRONTDESK';
    public const BOOKING_CHANNEL_PATIENT_PORTAL = 'PATIENT_PORTAL';
    public const BOOKING_CHANNEL_SYSTEM = 'SYSTEM';

    public const STATUS_REQUESTED = 'REQUESTED';
    public const STATUS_CONFIRMED = 'CONFIRMED';
    public const STATUS_CHECKED_IN = 'CHECKED_IN';
    public const STATUS_IN_PROGRESS = 'IN_PROGRESS';
    public const STATUS_COMPLETED = 'COMPLETED';
    public const STATUS_CANCELLED = 'CANCELLED';
    public const STATUS_NO_SHOW = 'NO_SHOW';

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'department_id',
        'clinic_id',
        'appointment_number',
        'appointment_date',
        'appointment_time',
        'type',
        'status',
        'visit_mode',
        'booking_channel',
        'scheduled_start',
        'scheduled_end',
        'confirmed_at',
        'is_walk_in',
        'reason',
        'notes',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'scheduled_start' => 'datetime',
        'scheduled_end' => 'datetime',
        'confirmed_at' => 'datetime',
        'is_walk_in' => 'boolean',
    ];

    // ==========================================
    // RELATIONSHIPS
    // ==========================================

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class, 'clinic_id');
    }

    public function videoSession(): HasOne
    {
        return $this->hasOne(VideoSession::class, 'appointment_id');
    }

    public static function activeScheduleStatuses(): array
    {
        return [
            self::STATUS_REQUESTED,
            self::STATUS_CONFIRMED,
            self::STATUS_CHECKED_IN,
            self::STATUS_IN_PROGRESS,
        ];
    }

    public static function blockingStatuses(): array
    {
        return self::activeScheduleStatuses();
    }

    public static function hasOverlap(int $doctorId, CarbonInterface $start, CarbonInterface $end, ?int $excludeId = null): bool
    {
        return self::query()
            ->where('doctor_id', $doctorId)
            ->whereIn('status', self::blockingStatuses())
            ->whereNotNull('scheduled_start')
            ->whereNotNull('scheduled_end')
            ->where('scheduled_start', '<', $end)
            ->where('scheduled_end', '>', $start)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->exists();
    }

    public static function normalizeStatus(?string $status): string
    {
        $normalized = strtoupper(trim((string) $status));

        $valid = [
            self::STATUS_REQUESTED,
            self::STATUS_CONFIRMED,
            self::STATUS_CHECKED_IN,
            self::STATUS_IN_PROGRESS,
            self::STATUS_COMPLETED,
            self::STATUS_CANCELLED,
            self::STATUS_NO_SHOW,
        ];

        if (in_array($normalized, $valid, true)) {
            return $normalized;
        }

        return match ($normalized) {
            'SCHEDULED', 'BOOKED', 'CONFIRMED' => self::STATUS_CONFIRMED,
            'COMPLETED' => self::STATUS_COMPLETED,
            'CANCELLED', 'CANCELED' => self::STATUS_CANCELLED,
            'NO_SHOW', 'NOSHOW' => self::STATUS_NO_SHOW,
            'CHECKED_IN', 'CHECKED-IN' => self::STATUS_CHECKED_IN,
            'IN_PROGRESS', 'IN_CONSULTATION' => self::STATUS_IN_PROGRESS,
            default => self::STATUS_CONFIRMED,
        };
    }
}
