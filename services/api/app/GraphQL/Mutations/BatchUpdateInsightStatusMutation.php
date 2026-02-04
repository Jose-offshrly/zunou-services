<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\LiveInsightOutbox;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;

final class BatchUpdateInsightStatusMutation
{
    /**
     * Batch update status for multiple insights with intelligent validation.
     * Processes each insight individually and returns comprehensive results.
     */
    public function __invoke($_, array $args): array
    {
        $insightIds = $args['insightIds'];
        $newStatus = $args['status'];
        $preventDowngrade = $args['preventDowngrade'] ?? true;
        $reason = $args['reason'] ?? null;

        // Validate input
        if (empty($insightIds)) {
            throw new Error('insightIds cannot be empty');
        }

        if (count($insightIds) > 100) {
            throw new Error('Cannot update more than 100 insights at once');
        }

        $now = now();
        $updatedInsights = [];
        $errors = [];

        // Process each insight individually
        foreach ($insightIds as $insightId) {
            try {
                $insight = $this->processInsightStatus(
                    $insightId,
                    $newStatus,
                    $preventDowngrade,
                    $reason,
                    $now
                );

                if ($insight) {
                    $updatedInsights[] = $insight;
                }
            } catch (Error $e) {
                $errors[] = [
                    'insightId' => $insightId,
                    'message' => $e->getMessage(),
                ];
            }
        }

        return [
            'updatedCount' => count($updatedInsights),
            'insights' => $updatedInsights,
            'errors' => $errors,
        ];
    }

    /**
     * Process status update for a single insight.
     */
    private function processInsightStatus(
        string $insightId,
        string $newStatus,
        bool $preventDowngrade,
        ?string $reason,
        $now
    ): ?LiveInsightOutbox {
        $row = LiveInsightOutbox::query()->findOrFail($insightId);

        // Check authorization
        $user = auth()->user();
        if ($row->user_id !== $user->id && !$user->hasPermission('admin:users')) {
            throw new Error("Forbidden: cannot modify insight {$insightId}");
        }

        // Validate status transition
        $this->validateStatusTransition($row->delivery_status, $newStatus, $preventDowngrade);

        // Apply status update using match expression
        $updated = match ($newStatus) {
            'pending' => $this->handlePendingStatus($row, $preventDowngrade),
            'delivered' => $this->handleDeliveredStatus($row, $preventDowngrade, $now),
            'seen' => $this->handleSeenStatus($row, $preventDowngrade, $now),
            'closed' => $this->handleClosedStatus($row, $reason, $now),
        };

        if ($updated) {
            $row->updated_at = $now;
            $row->save();
            return $row;
        }

        return null;
    }

    /**
     * Handle pending status transition.
     */
    private function handlePendingStatus(LiveInsightOutbox $row, bool $preventDowngrade): bool
    {
        if ($row->delivery_status === 'pending' || !$preventDowngrade) {
            $row->delivery_status = 'pending';
            return true;
        }
        return false;
    }

    /**
     * Handle delivered status transition.
     */
    private function handleDeliveredStatus(LiveInsightOutbox $row, bool $preventDowngrade, $now): bool
    {
        if (in_array($row->delivery_status, ['pending']) || 
            (!$preventDowngrade && in_array($row->delivery_status, ['seen', 'closed']))) {
            $row->delivery_status = 'delivered';
            $row->delivered_at = $now;
            return true;
        }
        return false;
    }

    /**
     * Handle seen status transition.
     */
    private function handleSeenStatus(LiveInsightOutbox $row, bool $preventDowngrade, $now): bool
    {
        if (in_array($row->delivery_status, ['pending', 'delivered']) || 
            (!$preventDowngrade && $row->delivery_status === 'closed')) {
            $row->delivery_status = 'seen';
            $row->read_at = $now;
            return true;
        }
        return false;
    }

    /**
     * Handle closed status transition.
     */
    private function handleClosedStatus(LiveInsightOutbox $row, ?string $reason, $now): bool
    {
        $row->delivery_status = 'closed';
        $row->closed_at = $now;
        
        if ($reason) {
            $row->closed_reason = $reason;
        }

        // Closing implies it has been seen
        if (is_null($row->read_at)) {
            $row->read_at = $now;
        }

        // If transitioning from pending/delivered, also set delivered_at
        if (in_array($row->delivery_status, ['pending', 'delivered'])) {
            $row->delivered_at = $now;
        }

        return true;
    }

    /**
     * Validate that the status transition is allowed.
     */
    private function validateStatusTransition(string $currentStatus, string $newStatus, bool $preventDowngrade): void
    {
        if ($currentStatus === $newStatus) {
            return;
        }

        $validTransitions = [
            'pending' => ['delivered', 'seen', 'closed'],
            'delivered' => ['seen', 'closed'],
            'seen' => ['closed'],
            'closed' => [],
        ];

        if (in_array($newStatus, $validTransitions[$currentStatus])) {
            return;
        }

        if (!$preventDowngrade) {
            $downgradeTransitions = [
                'delivered' => ['pending'],
                'seen' => ['pending', 'delivered'],
                'closed' => ['pending', 'delivered', 'seen'],
            ];

            if (in_array($newStatus, $downgradeTransitions[$currentStatus] ?? [])) {
                return;
            }
        }

        throw new Error("Invalid status transition from '{$currentStatus}' to '{$newStatus}'. " .
                       ($preventDowngrade ? 'Downgrades are not allowed.' : 'This transition is not supported.'));
    }
}
