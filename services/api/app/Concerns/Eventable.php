<?php

namespace App\Concerns;

use App\Models\EventOwner;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait Eventable
{
    public function eventsOwned(): MorphMany
    {
        return $this->morphMany(EventOwner::class, 'entity');
    }
}
