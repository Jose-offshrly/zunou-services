<?php

namespace App\Services\Agents\Helpers;

class AgentConfig
{
    protected const DEFAULT_AGENT_MODEL = 'OPENAI_REASONING_MODEL';

    public static function model(string $agent): string
    {
        $model = match ($agent) {
            'datasource' => env('DATASOURCE_AGENT_MODEL', 'gpt-4.1'),
            'meeting'    => env('MEETING_AGENT_MODEL', 'gpt-4.1'),
            'tasks'      => env('TASK_AGENT_MODEL', 'gpt-4.1'),
            'automation' => env('AUTOMATION_AGENT_MODEL'),
            'general'    => env('GENERAL_AGENT_MODEL'),
            'orgchart'   => env('ORGCHART_AGENT_MODEL', 'gpt-4.1'),
            default      => null,
        };

        return $model ?: env(self::DEFAULT_AGENT_MODEL);
    }

    public static function toolModel(string $agent, string $tool): string
    {
        $toolModel = match ([$agent, $tool]) {
            ['datasource', 'queryDataSource'] => env(
                'DATASOURCE_TOOL_QUERY_MODEL',
            ),

            ['meeting', 'generateMeetingSummary'] => env(
                'MEETING_TOOL_GENERATE_SUMMARY_MODEL',
                'gpt-4.1',
            ),
            ['meeting', 'viewAndCreatePersonalizedVersionOfMeetingSummary']
                => env('MEETING_TOOL_PERSONALIZED_SUMMARY_MODEL'),

            ['tasks', 'createTasks'] => env('TASK_TOOL_CREATE_TASKS_MODEL'),

            ['general', 'translateVideo'] => env(
                'GENERAL_TOOL_TRANSLATE_VIDEO_MODEL',
            ),
            ['automation', 'generateAutomation'] => env(
                'AUTOMATION_TOOL_GENERATE_AUTOMATION_MODEL',
            ),
            ['automation', 'generateMission'] => env(
                'AUTOMATION_TOOL_GENERATE_MISSION_MODEL',
            ),
            default => null,
        };

        // If tool model not set, fallback to agent model
        return $toolModel ?: self::model($agent);
    }
}
