<?php

namespace App\Contracts;

use Illuminate\Database\Eloquent\Relations\MorphMany;

interface Eventable
{
    public function eventsOwned(): MorphMany;
}
