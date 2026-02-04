<?php

namespace App\Models;

use App\Concerns\BelongsToOrganization;
use App\Concerns\BelongsToPulse;
use App\Concerns\BelongsToUser;
use App\Contracts\Participable;
use App\Enums\MeetingSessionStatus;
use App\Enums\MeetingSessionType;
use App\Enums\MeetingType;
use App\Observers\MeetingSessionObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

/**
 * @property mixed|null $companion_details
 */
#[ObservedBy(MeetingSessionObserver::class)]
class MeetingSession extends BaseModel implements Participable
{
    use \App\Concerns\Participable;
    use BelongsToOrganization;
    use BelongsToPulse;
    use BelongsToUser;

    protected $casts = [
        'status'               => MeetingSessionStatus::class,
        'type'                 => MeetingSessionType::class,
        'start_at'             => 'datetime',
        'end_at'               => 'datetime',
        'invite_pulse'         => 'boolean',
        'recurring_invite'     => 'boolean',
        'external_attendees'   => 'array',
        'recurring_meeting_id' => 'string',
        'meeting_type'         => MeetingType::class,
    ];

    public function entity(): MorphTo
    {
        return $this->morphTo();
    }

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class, 'internal_meeting_id');
    }

    public function dataSource(): BelongsTo
    {
        return $this->belongsTo(DataSource::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function eventInstance(): BelongsTo
    {
        return $this->belongsTo(EventInstance::class, 'event_instance_id');
    }

    public function events()
    {
        return $this->belongsToMany(Event::class)->withTimestamps();
    }

    public function scopeOnDate($query, $date)
    {
        // Force just the date part to avoid time drift issues
        $date = Carbon::parse((string) $date)->toDateString();

        $startOfDay = Carbon::parse($date, Auth::user()->timezone)
            ->startOfDay()
            ->timezone('UTC');
        $endOfDay = Carbon::parse($date, Auth::user()->timezone)
            ->endOfDay()
            ->timezone('UTC');

        return $query->whereBetween('start_at', [$startOfDay, $endOfDay]);
    }

    public function scopeDateRange($query, array $range)
    {
        [$startDate, $endDate] = $range;

        $timezone = Auth::user()->timezone;

        // Strip time and normalize both to user's local timezone then to UTC
        $startOfDay = Carbon::parse((string) $startDate)->toDateString(); // Just 'YYYY-MM-DD'

        $endOfDay = Carbon::parse((string) $endDate)->toDateString(); // Just 'YYYY-MM-DD'

        $start = Carbon::parse($startOfDay, $timezone)
            ->startOfDay()
            ->timezone('UTC');
        $end = Carbon::parse($endOfDay, $timezone)->endOfDay()->timezone('UTC');

        return $query->whereBetween('start_at', [$start, $end]);
    }

    public function getStartAtAttribute(): string
    {
        return Carbon::parse($this->attributes['start_at'])->userTimezone();
    }

    public function getEndAtAttribute(): string
    {
        return Carbon::parse($this->attributes['end_at'])->userTimezone();
    }
}
