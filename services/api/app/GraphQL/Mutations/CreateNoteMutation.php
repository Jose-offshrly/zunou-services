<?php

namespace App\GraphQL\Mutations;

use App\Models\Label;
use App\Models\Note;
use GraphQL\Error\Error;
use Illuminate\Database\QueryException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class CreateNoteMutation
{
    /**
     * Handle the GraphQL createNote mutation.
     *
     * @param  null  $_
     */
    public function __invoke($_, array $args): Note
    {
        // Extract labels from input, if any
        $labels = Arr::pull($args, 'labels', []);

        // Extract paths from input, if any
        $paths = Arr::pull($args, 'paths', []);

        // Validate label names are unique in the input
        if (count($labels) !== count(array_unique($labels))) {
            throw new Error('Duplicate label names are not allowed.');
        }

        // Ensure content is always a string (default to empty string if null or not provided)
        if (!isset($args['content']) || $args['content'] === null) {
            $args['content'] = '';
        }

        // Create the note
        $note = Note::create($args);

        $this->attachLabels(note: $note, labels: $labels);

        $this->attachFiles(note: $note, attachments: $paths);

        return $note->fresh();
    }

    public function attachLabels(Note $note, array $labels): void
    {
        if (!empty($labels)) {
            foreach ($labels as $labelName) {
                Log::info(
                    "Attaching label '{$labelName}' to note with ID {$note->id}"
                );
                try {
                    $label = Label::firstOrCreate(
                        [
                            'name' => $labelName,
                            'pulse_id' => $note->pulse_id,
                        ],
                        [
                            'name' => $labelName,
                            'pulse_id' => $note->pulse_id,
                        ]
                    );
                    $note->labels()->syncWithoutDetaching([$label->id]);
                } catch (QueryException $e) {
                    // Check for unique constraint violation (Postgres/SQLSTATE 23505)
                    if ($e->getCode() === '23505') {
                        throw new Error(
                            "A label with the name '{$labelName}' already exists."
                        );
                    }
                    throw $e;
                }
            }
        } else {
            Log::info(
                "No labels provided for note with ID {$note->id}, skipping label attachment."
            );
        }
    }

    public function detachLabels(Note $note, array $labelNames): void
    {
        if (!empty($labelNames)) {
            foreach ($labelNames as $labelName) {
                Log::info(
                    "Detaching label '{$labelName}' from note with ID {$note->id}"
                );
                try {
                    $label = Label::where('name', $labelName)
                        ->forPulse($note->pulse_id)
                        ->first();

                    if ($label) {
                        $note->labels()->detach($label->id);
                    }
                } catch (QueryException $e) {
                    Log::error(
                        "Failed to detach label '{$labelName}' from note with ID {$note->id}: " .
                            $e->getMessage()
                    );
                    throw $e;
                }
            }
        } else {
            Log::info(
                "No labels provided for note with ID {$note->id}, skipping label detachment."
            );
        }
    }

    public function detachAllLabels(Note $note): void
    {
        if (!empty($note->labels)) {
            foreach ($note->labels as $label) {
                Log::info(
                    "Detaching label '{$label->name}' from note with ID {$note->id}"
                );
                try {
                    $note->labels()->detach($label->id);
                } catch (QueryException $e) {
                    Log::error(
                        "Failed to detach labels from note with ID {$note->id}: " .
                            $e->getMessage()
                    );
                    throw $e;
                }
            }
        } else {
            Log::info(
                "No labels provided for note with ID {$note->id}, skipping label detachment."
            );
        }
    }

    public function attachFiles(Note $note, array $attachments): void
    {
        // Create files if paths are provided
        if (!empty($attachments)) {
            try {
                foreach ($attachments as $attachment) {
                    $note->files()->create([
                        'path' => $attachment['fileKey'],
                        'file_name' => $attachment['fileName'] ?? null,
                        'type' => $attachment['type'] ?? null,
                        'pulse_id' => $note->pulse_id,
                        'organization_id' => $note->organization_id,
                    ]);
                }
            } catch (QueryException $e) {
                throw new Error('Failed to create files: ' . $e->getMessage());
            }
        }
    }
}
