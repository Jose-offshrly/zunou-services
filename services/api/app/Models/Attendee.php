<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Attendee extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'recurring_event_id',
        'entity_type',
        'entity_id',
    ];

    protected static function booted(): void
    {
        static::saving(function (Attendee $attendee) {
            $hasEntity    = ! empty($attendee->entity_type) && ! empty($attendee->entity_id);
            $hasRecurring = ! empty($attendee->recurring_event_id);

            if (! $hasEntity && ! $hasRecurring) {
                throw new \InvalidArgumentException(
                    'Attendee must have either (entity_type + entity_id) or recurring_event_id set'
                );
            }
        });
    }

    public function entity(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function recurringEvent(): BelongsTo
    {
        return $this->belongsTo(RecurringEvent::class);
    }
}
