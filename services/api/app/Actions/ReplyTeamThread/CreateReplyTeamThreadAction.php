<?php

namespace App\Actions\ReplyTeamThread;

use App\Actions\GenerateAIReplyAction;
use App\DataTransferObjects\ReplyTeamThreadData;
use App\Events\TeamMessageSent;
use App\Helpers\StringHelper;
use App\Models\ReplyTeamThread;
use App\Models\TeamMessage;
use App\Models\User;

class CreateReplyTeamThreadAction
{
    public function handle(ReplyTeamThreadData $data): TeamMessage
    {
        $replyTeamThread = ReplyTeamThread::create([
            'team_thread_id' => $data->team_thread_id,
        ]);

        if ($replyTeamThread) {
            $metadata = [];
            $isAiMentioned = $this->is_pulse_mentioned($data->content);
            if ($isAiMentioned) {
                if ($data->metadata) {
                    $metadata = array_merge($metadata, ['status' => 'PENDING']);
                } else {
                    $metadata = ['status' => 'PENDING'];
                }
            }

            $teamMessage = TeamMessage::create([
                'team_thread_id' => $data->team_thread_id,
                'user_id' => $data->user_id,
                'is_parent_reply' => true,
                'reply_team_thread_id' => $replyTeamThread->id,
                'content' => $data->content,
                'topic_id' => $data->topic_id,
                'metadata' => $metadata,
            ]);

            broadcast(new TeamMessageSent($teamMessage))->toOthers();

            if ($isAiMentioned) {
                GenerateAIReplyAction::execute(
                    $teamMessage->refresh(),
                    User::find($data->user_id)
                );
            }
        }

        return $teamMessage;
    }

    private function is_pulse_mentioned($content): bool
    {
        if (
            str_contains(strtolower($content), '@pulse') ||
            StringHelper::hasPulseMention($content)
        ) {
            return true;
        }
        return false;
    }
}
