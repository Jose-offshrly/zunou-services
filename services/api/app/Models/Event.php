<?php

namespace App\Models;

use App\Concerns\BelongsToOrganization;
use App\Concerns\BelongsToPulse;
use App\Contracts\Participable;
use App\Enums\EventPriority;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class Event extends BaseModel implements Participable
{
    use \App\Concerns\Participable;
    use BelongsToOrganization;
    use BelongsToPulse;
    use HasFactory;
    use SoftDeletes;

    protected $casts = [
        'date'     => 'datetime',
        'start_at' => 'datetime',
        'end_at'   => 'datetime',
        'guests'   => 'array',
        'priority' => EventPriority::class,
    ];

    protected $attributes = [
        'priority' => EventPriority::MEDIUM,
    ];

    public function eventSource(): BelongsTo
    {
        return $this->belongsTo(EventSource::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function recurringEvent(): BelongsTo
    {
        return $this->belongsTo(RecurringEvent::class);
    }

    public function agendas(): HasMany
    {
        return $this->hasMany(Agenda::class);
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(Checklist::class);
    }

    public function meetingSession(): HasOne
    {
        return $this->hasOne(MeetingSession::class)->latest();
    }

    public function currentMeetingSession(): BelongsTo
    {
        return $this->belongsTo(
            MeetingSession::class,
            'current_meeting_session_id',
        );
    }

    public function meetingSessions()
    {
        return $this->belongsToMany(MeetingSession::class)->withTimestamps();
    }

    public function actionables(): HasMany
    {
        return $this->hasMany(Actionable::class);
    }

    public function meeting(): HasOne
    {
        return $this->hasOne(Meeting::class);
    }

    /**
     * @return HasOne the event owner associated with this event
     */
    public function eventOwner(): HasOne
    {
        return $this->hasOne(EventOwner::class);
    }

    /**
     * @return EventInstance[]|HasMany event instances associated with this event
     */
    public function eventInstances(): HasMany
    {
        return $this->hasMany(EventInstance::class);
    }

    public function scopeRecurring($query)
    {
        return $query->whereNotNull('recurring_event_id');
    }

    /**
     * Check if this is part of a recurring series.
     */
    public function isRecurringInstance(): bool
    {
        return $this->recurring_event_id !== null;
    }

    public function getDateAttribute(): ?string
    {
        if (isset($this->attributes['date'])) {
            return Carbon::parse($this->attributes['date'])->userTimezone();
        }

        return null;
    }

    public function getStartAtAttribute(): ?string
    {
        if (isset($this->attributes['start_at'])) {
            return Carbon::parse($this->attributes['start_at'])->userTimezone();
        }

        return null;
    }

    public function getEndAtAttribute(): ?string
    {
        if (isset($this->attributes['end_at'])) {
            return Carbon::parse($this->attributes['end_at'])->userTimezone();
        }

        return null;
    }

    public function getGuestsAttribute(): array
    {
        $rawGuests = $this->attributes['guests'] ?? null;

        if (! $rawGuests) {
            return [];
        }

        // If it's a JSON string, decode it first
        if (is_string($rawGuests)) {
            $rawGuests = json_decode($rawGuests, true) ?? [];
        }

        // Ensure it's an array
        if (! is_array($rawGuests)) {
            return [];
        }

        // Transform each guest into the desired format
        return array_map(function ($guest) {
            // If guest is already an object/array with name and gravatar, return as is
            if (is_array($guest) && isset($guest['name'], $guest['gravatar'])) {
                return $guest;
            }

            // Otherwise, treat it as a string (email or name)
            $guestString = is_string($guest) ? $guest : (string) $guest;

            return [
                'name'     => $guestString,
                'gravatar' => $this->gravatarUrl(strtolower(trim($guestString))),
            ];
        }, $rawGuests);
    }

    private function gravatarUrl(string $normalizedEmail): string
    {
        return 'https://www.gravatar.com/avatar/' . md5($normalizedEmail) . '?s=200&d=retro';
    }


    public function getParticipantsAttribute(): array
    {
        $participants = collect();

        // Add attendees (users in the system) - merge both morph and recurring event attendees
        $allAttendees = $this->getAllAttendees();

        // Load users for attendees that don't have them loaded yet
        $allAttendees->load('user');

        foreach ($allAttendees as $attendee) {
            $user = $attendee->user;

            if (! $user) {
                continue;
            }

            $participants->push([
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'gravatar' => $this->gravatarUrl(strtolower(trim($user->email))),
            ]);
        }

        // Add guests not already represented by an attendee
        // Build lookup sets for both emails and names to handle guest "name" being either
        $attendeeEmails = $participants->pluck('email')
            ->filter()
            ->map(fn ($e) => strtolower(trim($e)))
            ->flip()
            ->toArray();

        $attendeeNames = $participants->pluck('name')
            ->filter()
            ->map(fn ($n) => strtolower(trim($n)))
            ->flip()
            ->toArray();

        foreach ($this->guests as $guest) {
            $guestIdentifier = strtolower(trim($guest['name'] ?? ''));

            // Guest "name" could be an email or actual name, check both
            if (isset($attendeeEmails[$guestIdentifier]) || isset($attendeeNames[$guestIdentifier])) {
                continue;
            }

            $participants->push([
                'id'       => null,
                'name'     => $guest['name'] ?? null,
                'email'    => null,
                'gravatar' => $guest['gravatar'] ?? null,
            ]);
        }

        return $participants->values()->all();
    }

    /**
     * Get all EventInstances the user can access that relate to the same calendar event.
     *
     * Returns instances across different Event records that share the same google_event_id,
     * filtered by the user's pulse memberships. Access control is enforced at the instance
     * level via pulse membership, consistent with getVisibleMeetingSessions().
     *
     * @param  User  $user  The user to check visibility for
     * @return \Illuminate\Support\Collection<EventInstance>
     */
    public function getVisibleEventInstances(User $user): \Illuminate\Support\Collection
    {
        $organization_id = $this->organization_id;

        // Get all pulse IDs the user is a member of
        $userPulseIds = $user->pulseMemberships()->pluck('pulse_id');

        // If no google_event_id, we can only return instances of this specific event
        if (empty($this->google_event_id)) {
            return $this->eventInstances()
                ->whereIn('pulse_id', $userPulseIds)
                ->with(['pulse', 'meetingSession.dataSource'])
                ->get();
        }

        // Find ALL events with the same google_event_id in the same organization,
        // regardless of attendee status. Access control is enforced at the instance level
        // via pulse membership, consistent with getVisibleMeetingSessions().
        $relatedEventIds = Event::where('google_event_id', $this->google_event_id)
            ->where('organization_id', $organization_id)
            ->pluck('id');

        // Return all event instances across related events, filtered by user's pulse memberships
        return EventInstance::whereIn('event_id', $relatedEventIds)
            ->whereIn('pulse_id', $userPulseIds)
            ->with(['event', 'pulse', 'meetingSession.dataSource'])
            ->get();
    }

    /**
     * Get all MeetingSessions visible to the user for this event and related events with the same google_event_id.
     *
     * Intentionally does NOT filter related events by user_id, because recordings should be
     * visible across all event copies in the org (including other users' copies). Access control
     * is enforced at the MeetingSession level via pulse membership and session ownership.
     *
     * @see events.graphql — visibleMeetingSessions field contract:
     *      "Returns recordings across different Event records that share the same google_event_id,
     *       enabling users to see recordings from team channels or other users' event copies."
     *
     * @param  User  $user  The user to check visibility for
     * @return \Illuminate\Support\Collection<MeetingSession>
     */
    public function getVisibleMeetingSessions(User $user): \Illuminate\Support\Collection
    {
        // Get all pulse IDs the user is a member of
        $userPulseIds = $user->pulseMemberships()->pluck('pulse_id');

        // If no google_event_id, only return sessions for this specific event
        if (empty($this->google_event_id)) {
            return MeetingSession::where('event_id', $this->id)
                ->where(function ($query) use ($userPulseIds, $user) {
                    $query->whereIn('pulse_id', $userPulseIds)
                        ->orWhere('user_id', $user->id);
                })
                ->with(['dataSource', 'event'])
                ->get();
        }

        // Find ALL events with the same google_event_id in the same organization,
        // regardless of user_id. This enables cross-user recording visibility —
        // e.g., User B can see recordings from User A's event copy if they share a pulse.
        $relatedEventIds = Event::where('google_event_id', $this->google_event_id)
            ->where('organization_id', $this->organization_id)
            ->pluck('id');

        // Return all meeting sessions linked to any related event where user has access
        // (via pulse membership or session ownership)
        return MeetingSession::whereIn('event_id', $relatedEventIds)
            ->where(function ($query) use ($userPulseIds, $user) {
                $query->whereIn('pulse_id', $userPulseIds)
                    ->orWhere('user_id', $user->id);
            })
            ->with(['dataSource', 'event'])
            ->get();
    }
}
