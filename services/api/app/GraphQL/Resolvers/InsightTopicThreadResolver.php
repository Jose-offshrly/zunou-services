<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers;

final class InsightTopicThreadResolver
{
    public function topicThread($root, array $args)
    {
        return $root->topicThread;
    }
}