<?php

namespace App\GraphQL\Mutations;

use App\Actions\DataSource\CreateNoteDataSourceAction;
use App\Models\DataSource;
use App\Models\Note;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class CreateNoteDataSourceMutation
{
    public function __construct(
        private CreateNoteDataSourceAction $createNoteDataSourceAction
    ) {
    }

    /**
     * @throws Error
     * @throws \Exception
     */
    public function __invoke($_, array $args): DataSource
    {
        $user = Auth::user();
        if (!$user) {
            throw new Error('No user was found');
        }

        $note = Note::find($args['note_id']);

        if (!$note) {
            throw new Error(
                'Note not found or you do not have permission to access it'
            );
        }

        $dataSource = $this->createNoteDataSourceAction->handle(
            note: $note,
            organizationId: $args['organization_id'],
            pulseId: $args['pulse_id'],
            userId: $user->id,
            customName: $args['name'] ?? null,
            customDescription: $args['description'] ?? null
        );

        return $dataSource->refresh();
    }
}
