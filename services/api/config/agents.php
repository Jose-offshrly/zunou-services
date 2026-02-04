<?php

return [
    'agents' => [
        'datasource' => [
            'model' => env('DATASOURCE_AGENT_MODEL'),
            'tools' => [
                'queryDataSource' => [
                    'model' => env('DATASOURCE_TOOL_QUERY_MODEL'),
                ],
            ],
        ],

        'meeting' => [
            'model' => env('MEETING_AGENT_MODEL'),
            'tools' => [
                'generateMeetingSummary' => [
                    'model' => env('MEETING_TOOL_GENERATE_SUMMARY_MODEL'),
                ],
                'viewAndCreatePersonalizedVersionOfMeetingSummary' => [
                    'model' => env('MEETING_TOOL_PERSONALIZED_SUMMARY_MODEL'),
                ],
            ],
        ],

        'tasks' => [
            'model' => env('TASK_AGENT_MODEL'),
            'tools' => [
                'createTasks' => [
                    'model' => env('TASK_TOOL_CREATE_TASKS_MODEL'),
                ],
            ],
        ],

        'general' => [
            'model' => env('GENERAL_AGENT_MODEL'),
            'tools' => [
                'translateVideo' => [
                    'model' => env('GENERAL_TOOL_TRANSLATE_VIDEO_MODEL'),
                ],
            ],
        ],

        'automation' => [
            'model' => env('AUTOMATION_AGENT_MODEL'),
            'tools' => [
                'generateAutomation' => [
                    'model' => env('AUTOMATION_TOOL_GENERATE_AUTOMATION_MODEL'),
                ],
                'generateMission' => [
                    'model' => env('AUTOMATION_TOOL_GENERATE_MISSION_MODEL'),
                ],
            ],
        ],
    ],
];
