<?php

namespace App\GraphQL\Mutations;

use App\Actions\CreateSmartNotesAction;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CreateSmartNotesMutation
{
    /**
     * Handle the GraphQL createSmartNotes mutation.
     *
     * @param  null  $_
     */
    public function __invoke($_, array $args)
    {
        $user = Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        try {
            $this->validateInput($args);

            // Generate smart note structure using OpenAI
            $smartNote = CreateSmartNotesAction::createSmartNotesFromText(
                $args['note'],
            );

            // Ensure all required fields are present and non-null
            $title = isset($smartNote['title']) && trim($smartNote['title']) !== ''
                    ? $smartNote['title']
                    : 'Untitled Note';
            $note = isset($smartNote['note']) && trim($smartNote['note']) !== ''
                    ? $smartNote['note']
                    : '';
            $labels = isset($smartNote['labels']) && is_array($smartNote['labels'])
                    ? $smartNote['labels']
                    : [];

            // Use CreateNoteMutation to create the smart note
            $noteArgs = [
                'title'           => $title,
                'content'         => $note,
                'labels'          => $labels,
                'pinned'          => false,
                'pulse_id'        => $args['pulse_id'],
                'organization_id' => $args['organization_id'],
                'user_id'         => $args['user_id'] ?? $user->id,
            ];

            $createNoteMutation = new CreateNoteMutation();
            $savedNote          = $createNoteMutation(null, $noteArgs);

            return [
                'title'  => $title,
                'note'   => $note,
                'labels' => $labels,
            ];
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create smart notes: ' . $e->getMessage(),
            );
        }
    }

    private function validateInput(array $args): void
    {
        $validator = Validator::make(
            $args,
            [
                'note'            => 'required|string|min:1',
                'pulse_id'        => 'required|string|exists:pulses,id',
                'organization_id' => 'required|string|exists:organizations,id',
                'user_id'         => 'nullable|string|exists:users,id',
            ],
            [
                'note.required'            => 'Note text is required',
                'note.string'              => 'Note text must be a string',
                'note.min'                 => 'Note text cannot be empty',
                'pulse_id.required'        => 'Pulse ID is required',
                'pulse_id.exists'          => 'The specified pulse does not exist',
                'organization_id.required' => 'Organization ID is required',
                'organization_id.exists'   => 'The specified organization does not exist',
                'user_id.exists'           => 'The specified user does not exist',
            ],
        );

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }
}
