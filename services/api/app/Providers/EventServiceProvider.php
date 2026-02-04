<?php

namespace App\Providers;

use App\Events\OrganizationEventOccurred;
use App\Events\PulseEventOccurred;
use App\Events\ReplyGenerationStarted;
use App\Events\StartCompletionEvent;
use App\Events\TeamMessageSent;
use App\Listeners\OrganizationEventListener;
use App\Listeners\PulseEventListener;
use App\Listeners\ReplyGenerationStartedListener;
use App\Listeners\StartCompletionEventListener;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use App\Events\ReplyTeamMessageSent;
use App\Listeners\PersonalizationContext\PersonalizationSourceEventListener;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class                => [SendEmailVerificationNotification::class],
        StartCompletionEvent::class      => [StartCompletionEventListener::class],
        OrganizationEventOccurred::class => [OrganizationEventListener::class],
        PulseEventOccurred::class        => [PulseEventListener::class],
        ReplyGenerationStarted::class    => [
            ReplyGenerationStartedListener::class,
        ],
        TeamMessageSent::class => [
            [PersonalizationSourceEventListener::class, 'storeTeamMessageSource']
        ],
        ReplyTeamMessageSent::class => [
            [PersonalizationSourceEventListener::class, 'storeTeamMessageSource']
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        if (env('LOG_QUERIES', 'false') === true) {
            Event::listen(QueryExecuted::class, function ($query) {
                Log::info($query->sql, $query->bindings, $query->time);
            });
        }
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
