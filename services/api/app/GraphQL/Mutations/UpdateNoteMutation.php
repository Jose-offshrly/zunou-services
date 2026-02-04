<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Enums\PulseCategory;
use App\Models\Label;
use App\Models\Note;
use GraphQL\Error\Error;
use Illuminate\Database\QueryException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

final readonly class UpdateNoteMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): Note
    {
        // Extract note ID
        $noteId = Arr::pull($args, 'id');
        if (! $noteId) {
            throw new Error('Note ID is required.');
        }

        // Extract labels and paths from input, if provided
        $labels = Arr::pull($args, 'labels');
        $paths  = Arr::pull($args, 'paths');

        // Find the note
        $note = Note::find($noteId);
        if (! $note) {
            throw new Error('Note not found.');
        }

        Log::info(
            "Updating note with ID {$note->id} with args: " . json_encode($args),
        );

        // Update note fields (only fields that are provided)
        if (! empty($args)) {
            $args = array_filter($args, fn ($value) => ! is_null($value));
            $note->update($args);
        }

        // Sync labels only if explicitly provided in the input
        if ($labels !== null) {
            $this->syncLabels($note, $labels);
        }

        // Sync files only if explicitly provided in the input
        if ($paths !== null) {
            $this->syncFiles($note, $paths);
        }

        return $note->fresh();
    }

    private function syncLabels(Note $note, array $labelIds): void
    {
        // Validate all label IDs exist and validate their pulse association
        if (! empty($labelIds)) {
            // Validate label IDs are unique in the input
            if (count($labelIds) !== count(array_unique($labelIds))) {
                throw new Error('Duplicate label IDs are not allowed.');
            }

            // First, validate all labels exist
            $existingLabels = Label::whereIn('id', $labelIds)
                ->with('pulse')
                ->get();

            $existingLabelIds = $existingLabels->pluck('id')->toArray();
            $nonExistentLabels = array_diff($labelIds, $existingLabelIds);
            if (! empty($nonExistentLabels)) {
                throw new Error(
                    'Invalid label IDs: ' . implode(', ', $nonExistentLabels),
                );
            }

            // Validate each label: must belong to note's pulse OR belong to a personal pulse
            $invalidLabels = [];
            foreach ($existingLabels as $label) {
                $belongsToNotePulse = $label->pulse_id === $note->pulse_id;
                $belongsToPersonalPulse = $label->pulse && $label->pulse->category === PulseCategory::PERSONAL;

                if (! $belongsToNotePulse && ! $belongsToPersonalPulse) {
                    $invalidLabels[] = $label->id;
                }
            }

            if (! empty($invalidLabels)) {
                throw new Error(
                    'Invalid label IDs: ' . implode(', ', $invalidLabels) . '. Labels must belong to the note\'s pulse or to a personal pulse.',
                );
            }
        }

        // Sync labels (this will replace all existing labels with the provided ones)
        $note->labels()->sync($labelIds);
    }

    private function syncFiles(Note $note, array $attachments): void
    {
        // Remove existing files if attachments are provided
        if (! empty($attachments)) {
            $note->files()->delete();
            try {
                foreach ($attachments as $attachment) {
                    $note->files()->create([
                        'path'            => $attachment['fileKey'],
                        'file_name'       => $attachment['fileName'] ?? null,
                        'type'            => $attachment['type']          ?? null,
                        'pulse_id'        => $note->pulse_id,
                        'organization_id' => $note->organization_id,
                    ]);
                }
            } catch (QueryException $e) {
                throw new Error('Failed to update files: ' . $e->getMessage());
            }
        }
    }
}
