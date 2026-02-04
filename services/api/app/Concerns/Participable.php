<?php

namespace App\Concerns;

use App\Models\Attendee;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait Participable
{
    public function attendees(): MorphMany
    {
        return $this->morphMany(Attendee::class, 'entity');
    }

    public function userIsAttendee($userId): bool
    {
        if ($this->user_id === $userId) {
            return true;
        }

        return in_array($userId, $this->attendees->pluck('user_id')->toArray());
    }
}
