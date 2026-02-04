<?php

namespace App\GraphQL\Mutations;

use App\Actions\ReplyTeamThread\CreateReplyTeamThreadAction;
use App\DataTransferObjects\ReplyTeamThreadData;
use App\Models\TeamMessage;
use GraphQL\Error\Error;

readonly class CreateReplyTeamThreadMutation
{
    public function __construct(
        private CreateReplyTeamThreadAction $createReplyTeamThreadAction
    ) {
    }

    public function __invoke($_, array $args): TeamMessage
    {
        try {
            return $this->createReplyTeamThread($args['input']);
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create a reply team thread: ' . $e->getMessage()
            );
        }
    }

    private function createReplyTeamThread(array $input): TeamMessage
    {
        $data = new ReplyTeamThreadData(
            team_thread_id: $input['teamThreadId'],
            user_id: $input['userId'],
            content: $input['content'],
            topic_id: $input['topicId'] ?? null,
            metadata: $input['metadata'] ?? null
        );

        return $this->createReplyTeamThreadAction->handle($data);
    }
}
