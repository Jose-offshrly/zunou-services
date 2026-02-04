<?php

namespace App\Concerns;

use App\Models\Pulse;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToPulse
{
    public function pulse(): BelongsTo
    {
        return $this->belongsTo(Pulse::class);
    }
}
