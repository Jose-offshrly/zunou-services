<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Topic;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

final readonly class DeleteTopicMutation
{
    public function __invoke(null $_, array $args): bool
    {
        $user = Auth::user();
        
        if (!$user) {
            throw ValidationException::withMessages([
                'user' => ['User not authenticated'],
            ]);
        }

        $topic = Topic::find($args['input']['topicId']);
        
        if (!$topic) {
            throw ValidationException::withMessages([
                'topicId' => ['Topic not found'],
            ]);
        }

        // Delete all team messages associated with this topic first
        $topic->teamMessages()->delete();
        
        // Then delete the topic
        $topic->delete();

        return true;
    }
}
