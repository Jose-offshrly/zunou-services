<?php

namespace App\Contracts;

use Illuminate\Database\Eloquent\Relations\MorphMany;

interface Assignable
{
    public function assignees(): MorphMany;
}
