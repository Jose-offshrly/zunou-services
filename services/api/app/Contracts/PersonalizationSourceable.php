<?php

namespace App\Contracts;

use Illuminate\Database\Eloquent\Relations\MorphOne;

interface PersonalizationSourceable
{
    public function personalizationSource(): MorphOne;
}
