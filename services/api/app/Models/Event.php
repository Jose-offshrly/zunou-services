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
     * @return EventInstance[]|HasMany event instances associated with this event
     */
    public function eventInstances(): HasMany
    {
        return $this->hasMany(EventInstance::class);
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
                'gravatar' => 'https://www.gravatar.com/avatar/'.
                    md5(strtolower(trim($guestString))).
                    '?s=200&d=retro',
            ];
        }, $rawGuests);
    }

    public function getParticipantsAttribute(): array
    {
        $combined   = [];
        $usedEmails = []; // Track emails to avoid duplicates

        // Get attendees from the database relationship
        // Use the already loaded relationship to avoid N+1 queries
        $attendees = $this->attendees;
        foreach ($attendees as $attendee) {
            // Check if user is already loaded to avoid N+1
            if ($attendee->relationLoaded('user') && $attendee->user) {
                $email        = strtolower(trim($attendee->user->email));
                $usedEmails[] = $email;

                $combined[] = [
                    'id'       => $attendee->user->id,
                    'name'     => $attendee->user->name,
                    'email'    => $attendee->user->email,
                    'gravatar' => $attendee->user->gravatar,
                ];
            }
        }

        // Get guests from the JSON column (already formatted)
        $guests = $this->guests;
        foreach ($guests as $guest) {
            $guestName  = $guest['name'] ?? '';
            $guestEmail = null;

            // Check if guest name looks like an email
            if (filter_var($guestName, FILTER_VALIDATE_EMAIL)) {
                $guestEmail      = $guestName;
                $normalizedEmail = strtolower(trim($guestEmail));

                // Skip if this email is already used by an attendee
                if (in_array($normalizedEmail, $usedEmails)) {
                    continue;
                }
            }

            $combined[] = [
                'id'       => null, // Guests don't have user IDs
                'name'     => null, // Set name to null for guests
                'email'    => $guestEmail,
                'gravatar' => $guest['gravatar'],
            ];
        }

        return $combined;
    }
}
