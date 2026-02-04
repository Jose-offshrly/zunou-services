<?php

namespace App\Concerns;

use App\Models\Task;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait Taskable
{
    public function tasks(): MorphMany
    {
        return $this->morphMany(Task::class, 'entity');
    }
}
