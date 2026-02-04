<?php

namespace App\Factories;

use App\Contracts\RecommendationActionTypeInterface;
use App\Services\RecommendationActionType\Meeting;
use App\Services\RecommendationActionType\Note;
use App\Services\RecommendationActionType\Task;
use App\Services\RecommendationActionType\TeamChat;
use InvalidArgumentException;

class RecommendationActionTypesFactory
{
    public static function make(string $type): RecommendationActionTypeInterface
    {
        return match ($type) {
            'task' => new Task(),
            'note' => new Note(),
            'team_chat' => new TeamChat(),
            'meeting' => new Meeting(),
            default  => throw new InvalidArgumentException("Unsupported type: {$type}"),
        };
    }
}
