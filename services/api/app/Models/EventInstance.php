<?php

namespace App\Models;

use App\Concerns\BelongsToEvent;
use App\Concerns\BelongsToPulse;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class EventInstance extends BaseModel
{
    use BelongsToEvent;
    use BelongsToPulse;
    use SoftDeletes;

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
}
