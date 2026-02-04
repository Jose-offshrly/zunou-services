<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Agenda;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;

class UpdateAgendaOrderMutation
{
    public function __invoke($_, array $args): Collection
    {
        $input          = $args['input'] ?? [];
        $updatedAgendas = collect();

        try {
            foreach ($input as $item) {
                $agenda = Agenda::find($item['id']);
                if ($agenda) {
                    $agenda->position = $item['position'];
                    $agenda->save();
                    $updatedAgendas->push($agenda);
                }
            }
            return $updatedAgendas;
        } catch (\Exception $e) {
            throw new Error(
                'Failed to update agenda order: ' . $e->getMessage(),
            );
        }
    }
}
