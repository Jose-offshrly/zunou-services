<?php

namespace App\Models;

use App\Concerns\BelongsToOrganization;
use App\Concerns\BelongsToPulse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Actionable extends BaseModel
{
    use BelongsToOrganization;
    use BelongsToPulse;
    use HasFactory;

    protected $fillable = [
        'description',
        'pulse_id',
        'organization_id',
        'data_source_id',
        'event_id',
        'task_id',
        'status',
    ];

    public function dataSource(): BelongsTo
    {
        return $this->belongsTo(DataSource::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function scopeForEvent(Builder $query, string $eventId): Builder
    {
        return $query->where('event_id', $eventId);
    }
}
