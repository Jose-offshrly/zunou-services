<?php

namespace App\GraphQL\Queries;

use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

final readonly class WelcomeMessageQuery
{
    public function __invoke($rootValue, array $args)
    {
        $user = Auth::user();

        if (! $user) {
            throw new error('No user was found');
        }

        return $this->generateWelcomeMessage($user);
    }

    private function generateWelcomeMessage(User $user): string
    {
        $openAI = \OpenAI::client(Config::get('zunou.openai.api_key'));

        $user_context = $user->context->context_data;

        // Send a request to OpenAI's API to generate a title
        $response = $openAI->chat()->create([
            'model'    => Config::get('zunou.openai.model'),
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => 'Generate relevant welcome for the following user, be a little creative,',
                ],
                [
                    'role'    => 'user',
                    'content' => 'user:' .
                        $user->name .
                        ', user context:' .
                        $user_context,
                ],
            ],
            'max_tokens' => 50, // Limit the length of the generated message
            'n'          => 1,
        ]);

        // Extract the generated message from the API response
        $message = $response['choices'][0]['message']['content'] ?? 'Welcome!';

        // Log the generated message for debugging purposes
        Log::info('Generated welcome message:', ['message' => $message]);

        return $message;
    }
}
