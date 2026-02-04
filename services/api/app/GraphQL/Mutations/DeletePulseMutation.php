<?php

namespace App\GraphQL\Mutations;

use App\Actions\Pulse\DeletePulseAction;
use App\Models\Pulse;
use GraphQL\Error\Error;

final readonly class DeletePulseMutation
{
    public function __construct(private DeletePulseAction $deletePulseAction)
    {
    }

    /**
     * @throws Error
     */
    public function __invoke(null $_, array $args): bool
    {
        $user = auth()->user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $pulse = Pulse::findOrFail($args['pulseId']);

        return $this->deletePulseAction->handle(pulse: $pulse);
    }
}
