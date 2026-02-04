<?php

namespace App\Contracts;

use Illuminate\Database\Eloquent\Relations\MorphMany;

interface Participable
{
    public function attendees(): MorphMany;
}
