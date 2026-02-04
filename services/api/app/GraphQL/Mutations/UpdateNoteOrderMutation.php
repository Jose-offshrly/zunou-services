<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Note;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;

class UpdateNoteOrderMutation
{
    public function __invoke($_, array $args): Collection
    {
        $input        = $args['input'] ?? [];
        $updatedNotes = collect();

        try {
            foreach ($input as $item) {
                $note = Note::find($item['id']);
                if ($note) {
                    $note->position = $item['position'];
                    $note->save();
                    $updatedNotes->push($note);
                }
            }
            return $updatedNotes;
        } catch (\Exception $e) {
            throw new Error('Failed to update note order: ' . $e->getMessage());
        }
    }
}
