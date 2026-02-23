<?php

namespace App\Models;

use App\Concerns\BelongsToEvent;
use App\Concerns\BelongsToPulse;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class EventInstance extends BaseModel
{
    use BelongsToEvent;
    use BelongsToPulse;
    use SoftDeletes;

    protected $casts = [
        'is_recurring' => 'boolean',
    ];

    public function agendas(): HasMany
    {
        return $this->hasMany(Agenda::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(Checklist::class);
    }

    /**
     * Get the meeting session created from this event instance.
     */
    public function meetingSession(): HasOne
    {
        return $this->hasOne(MeetingSession::class, 'event_instance_id');
    }

    /**
     * Get the recurring event instance setup for this event instance.
     * Returns the setup if the event is part of a recurring series and has a setup for this pulse.
     */
    public function recurringEventInstanceSetup(): ?RecurringEventInstanceSetup
    {
        // Load the event and its recurring event if not already loaded
        if (!$this->relationLoaded('event')) {
            $this->load('event.recurringEvent');
        }

        $event = $this->event;

        // Check if event exists and has a recurring event
        if (!$event || !$event->recurring_event_id || !$event->recurringEvent) {
            return null;
        }

        // Get the setup for this pulse
        return $event->recurringEvent
            ->instanceSetups()
            ->where('pulse_id', $this->pulse_id)
            ->first();
    }

    public function getCreatedAtAttribute(): ?string
    {
        if (isset($this->attributes['created_at'])) {
            return Carbon::parse($this->attributes['created_at'])->userTimezone();
        }

        return null;
    }

    public function getUpdatedAtAttribute(): ?string
    {
        if (isset($this->attributes['updated_at'])) {
            return Carbon::parse($this->attributes['updated_at'])->userTimezone();
        }

        return null;
    }

    /**
     * Whether this event instance is part of a recurring series.
     */
    public function getIsRecurringInstanceAttribute(): bool
    {
        $event = $this->event;

        if (! $event || empty($event->google_event_id)) {
            return false;
        }

        // Google recurring instances use a base id with a suffix like "_<timestamp>".
        $parts = explode('_', $event->google_event_id, 2);
        if (count($parts) < 2) {
            return false;
        }

        $baseEventId = $parts[0];

        return Event::where('organization_id', $event->organization_id)
            ->where('google_event_id', 'like', $baseEventId . '%')
            ->where('start_at', '>=', now()->startOfDay())
            ->exists();
    }
}
