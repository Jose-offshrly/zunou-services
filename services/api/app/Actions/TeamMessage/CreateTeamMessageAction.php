<?php

namespace App\Actions\TeamMessage;

use App\DataTransferObjects\TeamMessageData;
use App\Events\ReplyTeamMessageSent;
use App\Events\TeamMessageSent;
use App\Models\File;
use App\Models\TeamMessage;
use App\Models\TeamThread;
use App\Jobs\ReportTopicUpdated;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CreateTeamMessageAction
{
    public function handle(TeamMessageData $data): TeamMessage
    {
        $teamMessage = TeamMessage::create([
            'team_thread_id' => $data->team_thread_id,
            'topic_id' => $data->topic_id ?? null,
            'user_id' => $data->user_id,
            'replied_to_message_id' => $data->replied_to_message_id ?? null,
            'reply_team_thread_id' => $data->reply_team_thread_id,
            'content' => $data->content,
            'metadata' => $data->metadata,
        ]);

        // Create file attachments if provided
        if ($data->files && !empty($data->files)) {
            $this->createFileAttachments($teamMessage, $data->files);
        }

        // Mark the message as read for the sender
        $user = Auth::user();
        if ($user) {
            $teamMessage->markAsRead($user);
        }

        $teamThread = TeamThread::with('pulse')->find($data->team_thread_id);

        if ($teamMessage !== null) {
            if ($data->reply_team_thread_id) {
                broadcast(
                    new ReplyTeamMessageSent($teamMessage->refresh())
                )->toOthers();
            }
            broadcast(new TeamMessageSent($teamMessage->refresh()))->toOthers();
        }

        if ($data->topic_id) {
            ReportTopicUpdated::dispatch($data->topic_id);
        }

        return $teamMessage->refresh();
    }

    /**
     * Create file attachments for the team message
     */
    private function createFileAttachments(
        TeamMessage $teamMessage,
        array $files
    ): void {
        $teamThread = TeamThread::with('pulse')->find(
            $teamMessage->team_thread_id
        );

        foreach ($files as $fileData) {
            File::create([
                'path' => $fileData['fileKey'],
                'file_name' => $fileData['fileName'],
                'type' => $fileData['type'],
                'entity_id' => $teamMessage->id,
                'entity_type' => TeamMessage::class,
                'pulse_id' => $teamThread->pulse_id,
                'organization_id' => $teamThread->pulse->organization_id,
            ]);
        }
    }
}
