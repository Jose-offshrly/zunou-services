<?php

namespace App\GraphQL\Mutations;

use App\Actions\User\DeleteUserAction;
use Illuminate\Support\Facades\Auth;

class DeleteUserMutation
{
    public function __construct(
        private readonly DeleteUserAction $deleteUserAction,
    ) {
    }

    public function __invoke($_, array $args): bool
    {
        $user = Auth::user();

        return $this->deleteUserAction->handle($user);
    }
}

