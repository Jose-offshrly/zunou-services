<?php

namespace App\Models;

use App\Enums\NotificationKind;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class Notification extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'description',
        'status',
        'kind',
        'organization_id',
        'pulse_id',
        'summary_id',
    ];

    public $timestamps = true;

    protected $casts = [
        'kind' => NotificationKind::class,
        'metadata' => 'array',
    ];

    public function scopeForPulse(Builder $query, string $pulseId): Builder
    {
        return $query->where('pulse_id', $pulseId);
    }

    public function getCreatedAtAttribute(): string
    {
        return Carbon::parse($this->attributes['created_at'])
            ->userTimezone()
            ->shortAbsoluteDiffForHumans();
    }

    public function getUpdatedAtAttribute(): string
    {
        return Carbon::parse($this->attributes['updated_at'])
            ->userTimezone()
            ->shortAbsoluteDiffForHumans();
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function pulse(): BelongsTo
    {
        return $this->belongsTo(Pulse::class);
    }

    public function summary(): BelongsTo
    {
        return $this->belongsTo(Summary::class);
    }

    public function context(): HasOne
    {
        return $this->hasOne(NotificationContext::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'notification_user')
            ->using(\App\Models\NotificationUser::class)
            ->withPivot(['read_at', 'is_archived'])
            ->withTimestamps();
    }
}
