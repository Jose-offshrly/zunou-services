<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\LiveInsightFeedback;
use App\Models\LiveInsightFeedbackAudit;
use App\Models\LiveInsightOutbox;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\DB;

final class GiveLiveInsightFeedbackMutation
{
    public function __invoke($_, array $args): LiveInsightFeedback
    {
        $outboxId = $args['outboxId'];
        $rating   = (int) $args['rating'];

        if ($rating < 1 || $rating > 5) {
            throw new Error('rating must be between 1 and 5');
        }

        /** @var LiveInsightOutbox $row */
        $row = LiveInsightOutbox::query()->findOrFail($outboxId);

        // Only the recipient (or an admin) can leave feedback
        $user = auth()->user();
        if ($row->user_id !== $user->id && ! $user->hasPermission('admin:users')) {
            throw new Error('Forbidden: cannot leave feedback on this insight.');
        }

        return DB::transaction(function () use ($row, $user, $rating, $args) {
            // Check if feedback already exists
            $existingFeedback = LiveInsightFeedback::where('outbox_id', $row->id)
                ->where('user_id', $user->id)
                ->first();

            $feedbackData = [
                'outbox_id' => $row->id,
                'user_id'   => $user->id,
                'rating'    => $rating,
                'tags'      => $args['tags']    ?? [],
                'comment'   => $args['comment'] ?? null,
            ];

            if ($existingFeedback) {
                // Create audit record before updating
                $this->createAuditRecord($existingFeedback, 'updated');

                // Update existing feedback
                $existingFeedback->update($feedbackData);

                return $existingFeedback;
            } else {
                // Create new feedback
                $feedback = LiveInsightFeedback::create($feedbackData);

                // Create audit record for new feedback
                $this->createAuditRecord($feedback, 'created');

                return $feedback;
            }
        });
    }

    /**
     * Create audit record for feedback changes.
     */
    private function createAuditRecord(LiveInsightFeedback $feedback, string $action): void
    {
        LiveInsightFeedbackAudit::create([
            'feedback_id' => $feedback->id,
            'outbox_id'   => $feedback->outbox_id,
            'user_id'     => $feedback->user_id,
            'rating'      => $feedback->rating,
            'tags'        => $feedback->tags,
            'comment'     => $feedback->comment,
            'action'      => $action,
            'created_at'  => now(),
        ]);
    }
}
