<?php

namespace App\Models;

use App\Enums\MeetingStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;

class Meeting extends BaseModel
{
    protected $fillable = [
        'id',
        'pulse_id',
        'meeting_id',
        'data_source_id',
        'user_id',
        'title',
        'date',
        'organizer',
        'source',
        'status',
        'event_id',
    ];

    protected $casts = [
        'date' => 'datetime',
        'status' => MeetingStatus::class,
    ];

    public function scopeForPulse(Builder $query, string $pulseId): Builder
    {
        return $query->where('pulse_id', $pulseId);
    }

    public function tasks(): MorphMany
    {
        return $this->morphMany(Task::class, 'source');
    }

    public function getDateAttribute(): string
    {
        return Carbon::parse($this->attributes['date'])->userTimezone();
    }

    public function dataSource(): BelongsTo
    {
        return $this->belongsTo(DataSource::class);
    }

    public function transcript(): HasOne
    {
        return $this->hasOne(Transcript::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function meetingSession(): HasOne
    {
        return $this->hasOne(MeetingSession::class, 'internal_meeting_id');
    }

    public function outboxes()
    {
        return $this->hasMany(LiveInsightOutbox::class, 'meeting_id');
    }
}
