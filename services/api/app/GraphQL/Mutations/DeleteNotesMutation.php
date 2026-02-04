<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Note;

final readonly class DeleteNotesMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $noteIds = $args['noteIds'] ?? [];
        if (empty($noteIds)) {
            return [
                'success' => false,
                'message' => 'No note IDs provided.',
            ];
        }

        try {
            Note::whereIn('id', $noteIds)->delete();
            return [
                'success' => true,
                'message' => 'Notes deleted successfully.',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to delete notes: ' . $e->getMessage(),
            ];
        }
    }
}
