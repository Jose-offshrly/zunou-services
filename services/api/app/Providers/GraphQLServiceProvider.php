<?php

namespace App\Providers;

use App\GraphQL\Mutations\CreateMeetingSessionMutation;
use App\GraphQL\Mutations\FetchGoogleCalendarEventsMutation;
use App\GraphQL\Mutations\GoogleCalendarRevokeMutation;
use App\GraphQL\Mutations\ImportGoogleCalendarMeetingsMutation;
use App\GraphQL\Mutations\SyncSingleEventMutation;
use App\GraphQL\Mutations\UpdateMeetingSessionMutation;
use App\GraphQL\Queries\GoogleCalendarEventsQuery;
use Illuminate\Support\ServiceProvider;

class GraphQLServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {
        $this->registerMutations();
        $this->registerQueries();
    }

    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot()
    {
        //
    }

    protected function registerMutations(): void
    {
        $this->app->singleton(CreateMeetingSessionMutation::class);
        $this->app->singleton(FetchGoogleCalendarEventsMutation::class);
        $this->app->singleton(ImportGoogleCalendarMeetingsMutation::class);
        $this->app->singleton(GoogleCalendarRevokeMutation::class);
        $this->app->singleton(SyncSingleEventMutation::class);
        $this->app->singleton(UpdateMeetingSessionMutation::class);
    }

    protected function registerQueries(): void
    {
        $this->app->singleton(GoogleCalendarEventsQuery::class);
    }
}
