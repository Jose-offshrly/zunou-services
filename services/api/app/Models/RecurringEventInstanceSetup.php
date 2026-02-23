<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecurringEventInstanceSetup extends BaseModel
{
    protected $fillable = [
        'recurring_event_id',
        'pulse_id',
        'setting',
        'invite_notetaker',
    ];

    protected $casts = [
        'setting'          => 'array',
        'invite_notetaker' => 'boolean',
    ];

    public function recurringEvent(): BelongsTo
    {
        return $this->belongsTo(RecurringEvent::class);
    }

    public function pulse(): BelongsTo
    {
        return $this->belongsTo(Pulse::class);
    }
}
