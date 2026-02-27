<?php

namespace App\Concerns;

use App\Models\Attendee;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait Participable
{
    /**
     * Morph-based attendees attached to this specific entity.
     */
    public function attendees(): MorphMany
    {
        return $this->morphMany(Attendee::class, 'entity');
    }

    /**
     * Attendees linked to the recurring event series (for recurring events only).
     */
    public function recurringEventAttendees(): HasMany
    {
        return $this->hasMany(Attendee::class, 'recurring_event_id', 'recurring_event_id');
    }

    /**
     * Get all attendees for this entity, merging both morph-based and recurring event attendees.
     * Use this method instead of the relationship when you need ALL attendees.
     * Deduplicates by user_id to avoid duplicate participants when both morph and recurring attendees exist.
     */
    public function getAllAttendees(): \Illuminate\Support\Collection
    {
        $attendees = $this->attendees;

        if ($this->recurring_event_id ?? null) {
            $attendees = $attendees->merge($this->recurringEventAttendees);
        }

        return $attendees->unique('user_id');
    }

    public function userIsAttendee($userId): bool
    {
        if ($this->user_id === $userId) {
            return true;
        }

        return $this->getAllAttendees()->pluck('user_id')->contains($userId);
    }
}
