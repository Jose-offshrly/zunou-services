<?php

namespace App\Jobs;

use App\Services\Personalization\PersonalizationContexts\PersonalizationContext;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessPersonalizationJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        protected PersonalizationContext $personalizationContext
    ) {
        
    }

    public function handle()
    {
        $this->personalizationContext->apply();
    }
}
