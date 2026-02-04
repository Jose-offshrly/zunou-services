<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\User\UpdateUserOpenaiApiKeyAction;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class UpdateUserOpenaiApiKeyMutation
{
    public function __construct(
        private readonly UpdateUserOpenaiApiKeyAction $updateUserOpenaiApiKeyAction,
    ) {
    }

    public function __invoke($_, array $args): User
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user found');
            }

            $openaiApiKey = $args['openai_api_key'] ?? null;

            return $this->updateUserOpenaiApiKeyAction->handle($user, $openaiApiKey);
        } catch (\Exception $e) {
            throw new Error('Failed to update OpenAI API key: '.$e->getMessage());
        }
    }
}
