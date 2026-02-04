<?php

namespace App\Models;

use App\Concerns\BelongsToOrganization;
use App\Concerns\BelongsToPulse;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Agenda extends BaseModel
{
    use BelongsToOrganization;
    use BelongsToPulse;
    use HasFactory;

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function eventInstance(): BelongsTo
    {
        return $this->belongsTo(EventInstance::class);
    }
}
