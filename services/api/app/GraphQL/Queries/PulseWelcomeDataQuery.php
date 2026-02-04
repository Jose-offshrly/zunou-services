<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\DataSource;
use App\Models\Meeting;
use App\Models\Pulse;
use App\Models\PulseMember;
use App\Models\Task;
use App\Models\TeamMessage;
use App\Models\TeamThread;
use App\Models\User;
use App\Services\Agents\Helpers\PulseWelcomeMessageHelper;
use Illuminate\Support\Carbon;

final readonly class PulseWelcomeDataQuery
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $pulse = Pulse::find($args['pulseId']);
        $user = User::find($args['userId']);

        if (!$pulse) {
            throw new \Exception('Pulse not found');
        }

        if (!$user) {
            throw new \Exception('User not found');
        }

        $pulseMember = PulseMember::forPulse($args['pulseId'])
            ->forUser($args['userId'])
            ->first();

        if (!$pulseMember) {
            throw new \Exception('Pulse member not found');
        }

        $lastVisited = $pulseMember->last_visited;

        // Convert last visited to UTC from user timezone
        $lastVisited = $lastVisited
            ? Carbon::parse($lastVisited)->setTimezone('UTC')
            : null;

        // Return the data sources, meetings, and tasks that have been updated since last visited
        // Use eager loading to prevent N+1 queries
        $dataSources = $lastVisited
            ? DataSource::forPulse($args['pulseId'])
                ->where('updated_at', '>', $lastVisited)
                ->where('origin', 'custom')
                ->with(['meeting.meetingSession.attendees.user', 'transcript'])
                ->get()
            : collect();

        $meetings = $lastVisited
            ? Meeting::forPulse($args['pulseId'])
                ->where('created_at', '>', $lastVisited)
                ->with(['meetingSession.attendees.user'])
                ->get()
            : collect();

        $tasks = $lastVisited
            ? Task::forEntity($args['pulseId'])
                ->where('created_at', '>', $lastVisited)
                ->with([
                    'assignees.user',
                    'createdBy',
                    'updatedBy',
                    'entity',
                    'children.assignees.user',
                ])
                ->get()
            : collect();

        $teamThread = TeamThread::forPulse($args['pulseId'])->first();

        if (!$teamThread) {
            \Log::warning('[PulseWelcomeDataQuery] TeamThread not found', [
                'pulseId' => $args['pulseId'],
            ]);
        }

        $teamMessages =
            $lastVisited && $teamThread
                ? TeamMessage::where('team_thread_id', $teamThread->id)
                    ->where('created_at', '>', $lastVisited)
                    ->with('user')
                    ->get()
                : collect();

        // Generate AI welcome message
        $messageHelper = new PulseWelcomeMessageHelper($pulse);
        $welcomeMessage = $messageHelper->generateWelcomeMessage([
            'pulseId' => $pulse->id,
            'userId' => $user->id,
            'lastVisited' => $lastVisited,
            'dataSources' => $dataSources,
            'meetings' => $meetings,
            'tasks' => $tasks,
            'teamMessages' => $teamMessages,
        ]);

        \Log::info('[PulseWelcomeDataQuery] Welcome message generated', [
            'pulseId' => $pulse->id,
            'userId' => $user->id,
            'message' => $welcomeMessage['message'],
        ]);

        return [
            'pulseId' => $pulse->id,
            'userId' => $user->id,
            'lastVisited' => $lastVisited
                ? $lastVisited->setTimezone($user->timezone)
                : null,
            'dataSources' => $dataSources,
            'meetings' => $meetings,
            'tasks' => $tasks,
            'teamMessages' => $teamMessages,
            'sentences' => $welcomeMessage['message'],
        ];
    }
}
