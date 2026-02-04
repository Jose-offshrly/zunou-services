<?php

namespace App\Concerns;

use App\Models\PersonalizationSource;
use Illuminate\Database\Eloquent\Relations\MorphOne;

trait PersonalizationSourceable
{
    public function personalizationSource(): MorphOne
    {
        return $this->morphOne(PersonalizationSource::class, 'source');
    }
}
