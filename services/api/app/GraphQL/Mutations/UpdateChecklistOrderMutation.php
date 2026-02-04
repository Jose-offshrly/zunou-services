<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Checklist;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;

class UpdateChecklistOrderMutation
{
    public function __invoke($_, array $args): Collection
    {
        $input             = $args['input'] ?? [];
        $updatedChecklists = collect();

        try {
            foreach ($input as $item) {
                $checklist = Checklist::find($item['id']);
                if ($checklist) {
                    $checklist->position = $item['position'];
                    $checklist->save();
                    $updatedChecklists->push($checklist);
                }
            }
            return $updatedChecklists;
        } catch (\Exception $e) {
            throw new Error(
                'Failed to update checklist order: ' . $e->getMessage(),
            );
        }
    }
}
