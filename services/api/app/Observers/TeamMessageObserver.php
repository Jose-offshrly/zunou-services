<?php

namespace App\Observers;

use App\Concerns\FeedHandler;
use App\Enums\FeedType;
use App\Models\Activity;
use App\Models\TeamMessage;
use App\Models\Topic;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class TeamMessageObserver
{
    use FeedHandler;

    public function created(TeamMessage $teamMessage): void
    {
        $this->createActivityLogsInBatch($teamMessage);

        // Update topic timestamp if message belongs to a topic
        if ($teamMessage->topic_id) {
            Topic::where('id', $teamMessage->topic_id)
                ->update(['updated_at' => now()]);
        }
    }

    private function createActivityLogsInBatch(TeamMessage $teamMessage): void
    {
        $teamMessage->loadMissing(['teamThread.pulse.members', 'user']);

        $pulse = $teamMessage->teamThread->pulse;
        $user = Auth::user() ?? $teamMessage->user;
        $now = now();
        $batchUuid = Str::uuid()->toString();

        $causerData = $teamMessage->user->only(['id', 'name', 'email', 'gravatar']);
        $properties = json_encode([
            'data'   => $teamMessage->toArray(),
            'causer' => $causerData,
        ]);

        $activityLogs = $pulse->members->map(function ($member) use (
            $teamMessage,
            $pulse,
            $user,
            $now,
            $batchUuid,
            $properties
        ) {
            return [
                'log_name'        => 'default',
                'description'     => 'Replied in ' . $pulse->name,
                'subject_type'    => TeamMessage::class,
                'subject_id'      => $teamMessage->id,
                'causer_type'     => $user ? get_class($user) : null,
                'causer_id'       => $user?->id,
                'properties'      => $properties,
                'batch_uuid'      => $batchUuid,
                'organization_id' => $teamMessage->teamThread->organization_id,
                'receiver_id'     => $member->user_id,
                'pulse_id'        => $pulse->id,
                'feed_type'       => FeedType::TEAMMESAGE->value,
                'created_at'      => $now,
                'updated_at'      => $now,
            ];
        })->toArray();

        if (!empty($activityLogs)) {
            Activity::insert($activityLogs);
        }
    }
}
