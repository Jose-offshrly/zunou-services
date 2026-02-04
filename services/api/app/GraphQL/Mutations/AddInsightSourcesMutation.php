<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\InsightSource;
use App\Models\LiveInsightOutbox;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\DB;

final class AddInsightSourcesMutation
{
    /**
     * Add multiple sources to an insight with contribution weights.
     */
    public function __invoke($_, array $args): LiveInsightOutbox
    {
        $insightId = $args['insightId'];
        $sources = $args['sources'];

        if (empty($sources)) {
            throw new Error('sources cannot be empty');
        }

        // Validate insight exists and user has access
        $insight = LiveInsightOutbox::query()->findOrFail($insightId);
        
        $user = auth()->user();
        if ($insight->user_id !== $user->id && !$user->hasPermission('admin:users')) {
            throw new Error('Forbidden: cannot modify this insight.');
        }

        return DB::transaction(function () use ($insight, $sources) {
            foreach ($sources as $sourceData) {
                $this->validateSourceData($sourceData);
                
                // Check if source already exists
                $existingSource = InsightSource::where('insight_id', $insight->id)
                    ->where('source_type', $sourceData['source_type'])
                    ->where('source_id', $sourceData['source_id'])
                    ->first();

                if ($existingSource) {
                    // Update existing source with new contribution weight
                    $existingSource->update([
                        'contribution_weight' => $sourceData['contribution_weight'],
                    ]);
                } else {
                    // Create new source
                    InsightSource::create([
                        'insight_id' => $insight->id,
                        'source_type' => $sourceData['source_type'],
                        'source_id' => $sourceData['source_id'],
                        'contribution_weight' => $sourceData['contribution_weight'],
                        'created_at' => now(),
                    ]);
                }
            }

            return $insight->fresh(['sources']);
        });
    }

    /**
     * Validate source data.
     */
    private function validateSourceData(array $sourceData): void
    {
        $validSourceTypes = ['meeting', 'note', 'task', 'calendar', 'document', 'email'];
        
        if (!in_array($sourceData['source_type'], $validSourceTypes)) {
            throw new Error("Invalid source_type: {$sourceData['source_type']}. Must be one of: " . implode(', ', $validSourceTypes));
        }

        if ($sourceData['contribution_weight'] < 0 || $sourceData['contribution_weight'] > 1) {
            throw new Error('contribution_weight must be between 0.0 and 1.0');
        }
    }
}
