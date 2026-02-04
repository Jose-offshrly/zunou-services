<?php

namespace App\Enums;

enum RecommendationActionTypes: string
{
    case MEETING = 'meeting';
    case TASK = 'task';
    case TEAM_CHAT = 'team_chat';

    /**
     * Get the corresponding agent class.
     */
    public function class(): string
    {
        return match($this) {
            self::TASK => \App\Services\Agents\SubAgents\TaskAgent::class,
            self::TEAM_CHAT => \App\Services\Agents\SubAgents\TeamChatAgent::class,
            self::MEETING => \App\Services\Agents\SubAgents\MeetingAgent::class,
        };
    }

    /**
     * Get enum case from a given class.
     */
    public static function fromClass(string $class): ?self
    {
        return collect(self::cases())
            ->first(fn($case) => $case->class() === $class);
    }
}