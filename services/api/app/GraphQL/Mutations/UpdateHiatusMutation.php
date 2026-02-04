<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Hiatus\UpdateHiatusAction;
use App\Models\Hiatus;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

final readonly class UpdateHiatusMutation
{
    public function __construct(private UpdateHiatusAction $updateHiatusAction)
    {
    }

    public function __invoke($_, array $args): Hiatus
    {
        $user = Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $hiatus = Hiatus::find($args['hiatusId']);
        if (! $hiatus) {
            throw new Error('No hiatus record was found');
        }

        Log::info('args: ' . json_encode($args));

        return $this->updateHiatusAction->handle(hiatus: $hiatus);
    }
}
