<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\CreateTopicFromInsightAction;
use App\Enums\OrganizationUserRole;
use App\Enums\TopicReferenceType;
use App\Models\OrganizationUser;
use App\Models\Topic;
use App\Models\TeamThread;
use App\Models\Thread;
use App\Jobs\ReportTopicUpdated;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final readonly class CreateTopicMutation
{
    public function __invoke(null $_, array $args): Topic
    {
        $user = Auth::user();

        if (!$user) {
            throw ValidationException::withMessages([
                'user' => ['User not authenticated'],
            ]);
        }

        $input = $args['input'];

        $teamThreadId = $input['teamThreadId'] ?? null;
        if ($teamThreadId) {
            // Link to existing TeamThread
            $teamThread = TeamThread::where('id', $teamThreadId)->first();
            if (!$teamThread) {
                throw ValidationException::withMessages([
                    'teamThreadId' => ['Team thread not found'],
                ]);
            }

            // Handle reference if provided (optional when teamThreadId is provided)
            $referenceData = $this->validateAndGetReference(
                $input['referenceId'] ?? null,
                $input['referenceType'] ?? null,
                false
            );

            $topicData = [
                'entity_id' => $teamThread->id,
                'entity_type' => TeamThread::class,
                'name' => $input['name'],
                'created_by' => (string) $user->id,
            ];

            if ($referenceData) {
                $topicData['reference_id'] = $referenceData['reference_id'];
                $topicData['reference_type'] = $referenceData['reference_type'];
            }

            $topic = Topic::create($topicData);
            ReportTopicUpdated::dispatch($topic->id);
            $loadedTopic = $topic->load(['creator']);
        } else {
            // Fallback: create a dedicated Thread for this Topic
            // Reference is required in this case
            if (empty($input['organizationId']) || empty($input['pulseId'])) {
                throw ValidationException::withMessages([
                    'organizationId' => [
                        'organizationId is required when teamThreadId is not provided',
                    ],
                    'pulseId' => [
                        'pulseId is required when teamThreadId is not provided',
                    ],
                ]);
            }

            // Reference is required in fallback case
            $referenceData = $this->validateAndGetReference(
                $input['referenceId'] ?? null,
                $input['referenceType'] ?? null,
                true
            );

            $id = Str::uuid()->toString();

            // Determine thread type based on organization user role
            $threadType = $this->getThreadType(
                $user->id,
                $input['organizationId']
            );

            $threadPayload = [
                'id' => $id,
                'name' => $input['name'],
                'organization_id' => $input['organizationId'],
                'pulse_id' => $input['pulseId'] ?? null,
                'type' => $threadType,
                'user_id' => $user->id,
                'is_topic' => true,
                'third_party_id' => $id,
            ];

            $thread = Thread::create($threadPayload);

            $topicData = [
                'entity_id' => $thread->id,
                'entity_type' => Thread::class,
                'name' => $input['name'],
                'created_by' => (string) $user->id,
                'reference_id' => $referenceData['reference_id'],
                'reference_type' => $referenceData['reference_type'],
            ];

            $topic = Topic::create($topicData);
            $loadedTopic = $topic->load(['creator']);

            $mainThread = Thread::forPulse($input['pulseId'])
                ->whereActive(true)
                ->first();

            CreateTopicFromInsightAction::execute($topic, $mainThread, $thread);
        }

        return $loadedTopic;
    }

    /**
     * Get thread type based on organization user role.
     * Returns 'admin' for OWNER, 'guest' for GUEST, 'user' for USER or default.
     */
    private function getThreadType(
        string $userId,
        string $organizationId
    ): string {
        $organizationUser = OrganizationUser::where('user_id', $userId)
            ->where('organization_id', $organizationId)
            ->first();

        if (!$organizationUser) {
            // Default to 'user' if organization user not found
            return 'user';
        }

        return match ($organizationUser->role) {
            OrganizationUserRole::Owner->value => 'admin',
            OrganizationUserRole::Guest->value => 'guest',
            OrganizationUserRole::User->value => 'user',
            default => 'user',
        };
    }

    /**
     * Validate and get the reference model if referenceId and referenceType are provided.
     */
    private function validateAndGetReference(
        ?string $referenceId,
        ?string $referenceType,
        bool $required = false
    ): ?array {
        if (!$referenceId || !$referenceType) {
            if ($required) {
                throw ValidationException::withMessages([
                    'referenceId' => ['Reference ID is required'],
                    'referenceType' => ['Reference type is required'],
                ]);
            }
            return null;
        }

        try {
            $referenceTypeEnum = TopicReferenceType::from($referenceType);
        } catch (\ValueError $e) {
            throw ValidationException::withMessages([
                'referenceType' => ['Invalid reference type'],
            ]);
        }

        $modelClass = $referenceTypeEnum->getModelClass();
        $reference = $modelClass::find($referenceId);

        if (!$reference) {
            throw ValidationException::withMessages([
                'referenceId' => ['Reference not found'],
            ]);
        }

        return [
            'reference_id' => (string) $reference->id,
            'reference_type' => $modelClass,
        ];
    }
}
