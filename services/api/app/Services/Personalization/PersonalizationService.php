<?php

namespace App\Services\Personalization;

use App\Contracts\PersonalizationSourceable;
use App\Models\PersonalizationSource;
use App\Models\User;

class PersonalizationService
{
    public function storeSource(PersonalizationSourceable $source): PersonalizationSource
    {
        return $source->personalizationSource()->create();
    }
}
