<?php

namespace App\Contracts;

use Illuminate\Database\Eloquent\Relations\MorphMany;

interface Taskable
{
    public function tasks(): MorphMany;
}
