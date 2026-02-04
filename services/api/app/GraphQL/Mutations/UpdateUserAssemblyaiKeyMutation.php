<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\User\UpdateUserAssemblyaiKeyAction;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class UpdateUserAssemblyaiKeyMutation
{
    public function __construct(
        private readonly UpdateUserAssemblyaiKeyAction $updateUserAssemblyaiKeyAction
    ) {
    }

    public function __invoke($_, array $args): User
    {
        try {
            $user = Auth::user();
            if (!$user) {
                throw new Error('No user found');
            }

            $assemblyaiKey = $args['assemblyai_key'] ?? null;

            return $this->updateUserAssemblyaiKeyAction->handle(
                $user,
                $assemblyaiKey
            );
        } catch (\Exception $e) {
            throw new Error(
                'Failed to update AssemblyAI API key: ' . $e->getMessage()
            );
        }
    }
}
