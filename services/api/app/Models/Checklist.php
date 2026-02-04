<?php

namespace App\Models;

use App\Concerns\BelongsToOrganization;
use App\Concerns\BelongsToPulse;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Checklist extends BaseModel
{
    use BelongsToOrganization;
    use BelongsToPulse;

    protected $fillable = [
        'name',
        'complete',
        'pulse_id',
        'organization_id',
        'event_id',
        'event_instance_id',
        'position',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function eventInstance(): BelongsTo
    {
        return $this->belongsTo(EventInstance::class);
    }
}
