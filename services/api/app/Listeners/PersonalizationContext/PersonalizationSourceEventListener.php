<?php

namespace App\Listeners\PersonalizationContext;

use App\Contracts\PersonalizationSourceable;
use App\Services\Personalization\PersonalizationService;
use App\Services\Personalization\PersonalizationContexts\TeamMessagePersonalization;
use App\Services\Personalization\PersonalizationContexts\PersonalizationContextGenerator;

class PersonalizationSourceEventListener
{
    public function __construct(
        private PersonalizationService $personalizationService
    ) {}

    public function storeTeamMessageSource($event)
    {
        $this->storeSource($event->teamMessage);
        
        // For now, we run the personalization & context generator everytime we received a team message so that we can have real time data.
        // TODO: Think about the timings for this.
        PersonalizationContextGenerator::dispatch();
    }

    protected function storeSource(PersonalizationSourceable $source)
    {
        return $this->personalizationService->storeSource($source);
    }
}
