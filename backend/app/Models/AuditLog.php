<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'actor_user_id',
        'request_id',
        'action',
        'entity_type',
        'entity_id',
        'before_data',
        'after_data',
        'changes',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'changes' => 'array',
        'before_data' => 'array',
        'after_data' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $log): void {
            if (empty($log->actor_user_id) && !empty($log->user_id)) {
                $log->actor_user_id = $log->user_id;
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
