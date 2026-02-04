<?php

namespace App\GraphQL\Mutations;

use App\Actions\GenerateAIReplyAction;
use App\Actions\TeamMessage\CreateTeamMessageAction;
use App\DataTransferObjects\TeamMessageData;
use App\Helpers\StringHelper;
use App\Models\TeamMessage;
use App\Services\Content\ContentSanitizationService;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Sentry\SentrySdk;
use Sentry\Tracing\TransactionContext;

readonly class CreateTeamMessageMutation
{
    public function __construct(
        private CreateTeamMessageAction $createTeamMessageAction,
        private ContentSanitizationService $contentSanitizationService,
    ) {}

    public function __invoke($_, array $args): TeamMessage
    {
        /*
         * Set up sentry for performance monitoring
         */
        $context = new TransactionContext();
        $context->setOp('graphql.mutation');
        $context->setName('CreateTeamMessageMutation');
        $transaction = SentrySdk::getCurrentHub()->startTransaction($context);
        SentrySdk::getCurrentHub()->setSpan($transaction);

        try {
            $user = Auth::user();
            if (! $user) {
                throw new error('No user was found');
            }

            $teamMessage = $this->createTeamMessage($args['input']);

            if ($teamMessage->replyTeamThread) {
                $this->updateParentMessageTimestamp($teamMessage);

                if ($this->checkIfRecepientIsAI($teamMessage)) {
                    GenerateAIReplyAction::execute($teamMessage, $user);
                }
            }

            return $teamMessage;
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create a team message: ' . $e->getMessage(),
            );
        } finally {
            $transaction->finish();
        }
    }

    private function createTeamMessage(array $input): TeamMessage
    {
        $data = new TeamMessageData(
            team_thread_id: $input['teamThreadId'],
            user_id: $input['userId'],
            reply_team_thread_id: $input['replyTeamThreadId'] ?? null,
            topic_id: $input['topicId'] ?? null,
            replied_to_message_id: $input['repliedToMessageId'] ?? null,
            content: $input['content'],
            metadata: $input['metadata'] ?? null,
            files: $input['files'] ?? null
        );

        return $this->createTeamMessageAction->handle($data);
    }

    private function checkIfRecepientIsAI(TeamMessage $teamMessage)
    {
        if (str_contains(strtolower($teamMessage->content), '@pulse') || StringHelper::hasPulseMention($teamMessage->content)) {
            return true;
        }

        return false;
    }

    private function updateParentMessageTimestamp(TeamMessage $teamMessage)
    {
        $parentMessage = TeamMessage::where(
            'reply_team_thread_id',
            $teamMessage->replyTeamThread->id,
        )
            ->where('is_parent_reply', true)
            ->first();
        $parentMessage->updated_at = now();
        $parentMessage->save();
    }
}
