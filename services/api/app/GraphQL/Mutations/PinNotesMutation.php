<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Note;

final readonly class PinNotesMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $noteIds = $args['noteIds'] ?? [];
        if (empty($noteIds)) {
            return [
                'success' => [],
                'message' => 'No note IDs provided.',
            ];
        }
        Note::whereIn('id', $noteIds)->update(['pinned' => true]);
        // return updated notes
        $updatedNotes = Note::whereIn('id', $noteIds)->get();
        return $updatedNotes;
    }
}
