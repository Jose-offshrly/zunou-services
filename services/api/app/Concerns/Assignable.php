<?php

namespace App\Concerns;

use App\Models\Assignee;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait Assignable
{
    public function assignees(): MorphMany
    {
        return $this->morphMany(Assignee::class, 'entity');
    }
}
