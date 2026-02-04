<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Topic;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

final readonly class UpdateTopicMutation
{
    public function __invoke(null $_, array $args): Topic
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

        // Update only provided fields
        $updateData = [];

        if (isset($args['input']['name'])) {
            $updateData['name'] = $args['input']['name'];
        }

        $topic->update($updateData);

        return $topic->load(['creator']);
    }
}
