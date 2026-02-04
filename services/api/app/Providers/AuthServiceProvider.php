<?php

namespace App\Providers;

use App\Models\Agent;
use App\Models\Collaboration;
use App\Models\Contact;
use App\Models\DataSource;
use App\Models\DirectMessageThread;
use App\Models\Event;
use App\Models\Hiatus;
use App\Models\Integration;
use App\Models\Label;
use App\Models\LiveInsightOutbox;
use App\Models\Meeting;
use App\Models\MeetingSession;
use App\Models\MisalignmentAlert;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\Organization;
use App\Models\OrganizationGroup;
use App\Models\OrganizationUser;
use App\Models\Pulse;
use App\Models\PulseMember;
use App\Models\ReplyTeamThread;
use App\Models\SavedMessage;
use App\Models\Strategy;
use App\Models\Task;
use App\Models\TaskPhase;
use App\Models\TaskStatus;
use App\Models\TeamMessage;
use App\Models\TeamThread;
use App\Models\Thread;
use App\Models\Timesheet;
use App\Models\Transcript;
use App\Models\User;
use App\Models\Widget;
use App\Policies\AgentPolicy;
use App\Policies\CollaborationPolicy;
use App\Policies\ContactPolicy;
use App\Policies\DataSourcePolicy;
use App\Policies\DirectMessageThreadPolicy;
use App\Policies\EventPolicy;
use App\Policies\HiatusPolicy;
use App\Policies\IntegrationPolicy;
use App\Policies\LabelPolicy;
use App\Policies\LiveInsightOutboxPolicy;
use App\Policies\MeetingPolicy;
use App\Policies\MeetingSessionPolicy;
use App\Policies\MisalignmentAlertPolicy;
use App\Policies\NotificationPolicy;
use App\Policies\NotificationPreferencePolicy;
use App\Policies\OrganizationGroupPolicy;
use App\Policies\OrganizationPolicy;
use App\Policies\OrganizationUserPolicy;
use App\Policies\PulseMemberPolicy;
use App\Policies\PulsePolicy;
use App\Policies\ReplyTeamThreadPolicy;
use App\Policies\SavedMessagePolicy;
use App\Policies\StrategyPolicy;
use App\Policies\TaskPhasePolicy;
use App\Policies\TaskPolicy;
use App\Policies\TaskStatusPolicy;
use App\Policies\TeamMessagePolicy;
use App\Policies\TeamThreadPolicy;
use App\Policies\ThreadPolicy;
use App\Policies\TimesheetPolicy;
use App\Policies\TranscriptPolicy;
use App\Policies\UserPolicy;
use App\Policies\WidgetPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Auth;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Agent::class               => AgentPolicy::class,
        Collaboration::class       => CollaborationPolicy::class,
        Contact::class             => ContactPolicy::class,
        DataSource::class          => DataSourcePolicy::class,
        DirectMessageThread::class => DirectMessageThreadPolicy::class,
        Event::class               => EventPolicy::class,
        Hiatus::class              => HiatusPolicy::class,
        Integration::class         => IntegrationPolicy::class,
        Label::class               => LabelPolicy::class,
        LiveInsightOutbox::class   => LiveInsightOutboxPolicy::class,
        Meeting::class             => MeetingPolicy::class,
        MeetingSession::class      => MeetingSessionPolicy::class,
        MisalignmentAlert::class   => MisalignmentAlertPolicy::class,
        Notification::class           => NotificationPolicy::class,
        NotificationPreference::class => NotificationPreferencePolicy::class,
        Organization::class           => OrganizationPolicy::class,
        OrganizationGroup::class   => OrganizationGroupPolicy::class,
        OrganizationUser::class    => OrganizationUserPolicy::class,
        Pulse::class               => PulsePolicy::class,
        PulseMember::class         => PulseMemberPolicy::class,
        ReplyTeamThread::class     => ReplyTeamThreadPolicy::class,
        SavedMessage::class        => SavedMessagePolicy::class,
        Strategy::class            => StrategyPolicy::class,
        Task::class                => TaskPolicy::class,
        TaskPhase::class           => TaskPhasePolicy::class,
        TaskStatus::class          => TaskStatusPolicy::class,
        TeamMessage::class         => TeamMessagePolicy::class,
        TeamThread::class          => TeamThreadPolicy::class,
        Thread::class              => ThreadPolicy::class,
        Timesheet::class           => TimesheetPolicy::class,
        Transcript::class          => TranscriptPolicy::class,
        User::class                => UserPolicy::class,
        Widget::class              => WidgetPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        Auth::extend('jwt_guard', function ($app, $name, array $config) {
            return new \App\Guards\JwtGuard(
                Auth::createUserProvider($config['provider']),
                $app['request'],
            );
        });
    }
}
