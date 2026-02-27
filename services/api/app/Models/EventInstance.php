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
     *
     * Uses the already-eager-loaded event relationship and checks recurring_event_id
     * which is populated during Google Calendar sync. This avoids N+1 queries that
     * would occur with per-row EXISTS checks.
     */
    public function getIsRecurringInstanceAttribute(): bool
    {
        $event = $this->event;

        return $event && $event->recurring_event_id !== null;
    }
}
