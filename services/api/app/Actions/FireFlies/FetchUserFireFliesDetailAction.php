<?php

namespace App\Actions\FireFlies;

use App\DataTransferObjects\FireFliesUserData;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Log;

class FetchUserFireFliesDetailAction
{
    /**
     * Fetch user FireFlies detail with error handling
     */
    public function handle(string $api_key, User $user): FireFliesUserData
    {
        $response = app(CallFireFliesApiAction::class)->handle(
            api_key: $api_key,
            query: $this->query(),
        );

        // Check if the response is empty (error case)
        if (empty($response) || ! isset($response['data']['user'])) {
            Log::error('FetchUserFireFliesDetailAction: Failed to fetch user details', [
                'response' => $response,
            ]);

            // Return a default user data object or throw a custom exception
            throw new Error('Failed to feth user details');
        }

        $ff_user = $response['data']['user'];

        Log::info(
            'FetchUserFireFliesDetailAction: fire flies user'.$ff_user['name'],
        );

        return new FireFliesUserData(
            user_id: $ff_user['user_id'],
            name: $ff_user['name'],
            email: $ff_user['email'],
        );
    }

    private function query(): string
    {
        return <<<'GRAPHQL'
query User {
    user {
        user_id
        email
        name
    }
}

GRAPHQL;
    }
}
