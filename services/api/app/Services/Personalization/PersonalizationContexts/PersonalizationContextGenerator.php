<?php

namespace App\Services\Personalization\PersonalizationContexts;

use App\Models\PersonalizationContext;
use App\Models\PersonalizationSource;
use App\Models\TeamMessage;
use App\Models\User;
use App\Services\Personalization\PersonalizationContexts\PersonalizationSummaryGenerator;
use App\Services\Personalization\PersonalizationContexts\TeamMessagePersonalization;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class PersonalizationContextGenerator implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle()
    {
        $sources = $this->sources()->groupBy('source_type');
        
        if ($sources->has(TeamMessage::class)) {
            $teamMessagePersonalization = new TeamMessagePersonalization;

            $teamMessagePersonalization->applyCategories(
                $sources[TeamMessage::class]
            );
        }

        $this->dispatchSummaryGenerator();
    }

    protected function sources(): Collection
    {
        return PersonalizationSource::whereNull('last_used_at')
            ->get();
    }

    protected function dispatchSummaryGenerator()
    {
        $userIds = PersonalizationContext::where('expires_at', '>', now())
            ->distinct()
            ->pluck('user_id');

        User::whereIn('id', $userIds)
            ->each(function (User $user) {
                PersonalizationSummaryGenerator::dispatch($user);
            });
    }
}