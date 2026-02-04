<?php

namespace Tests\Feature;

use App\Services\Agents\SubAgents\TaskAgent;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Tests\TestCase;

class TaskAgentTest extends TestCase
{
    public function testTaskAgentCanCreateTaskFromMeetingWithRelativeDate()
    {
        $userId  = '9de646fb-614b-445d-8c93-cf1a35d6ce29';
        $pulseId = '4ed4d29e-79b7-4c0f-8ec0-b38b2fc18835';

        $user  = \App\Models\User::findOrFail($userId);
        $pulse = \App\Models\Pulse::findOrFail($pulseId);

        $orgId = $pulse->organization_id;

        $thread = \App\Models\Thread::create([
            'name'            => 'Test Task Agent Thread',
            'organization_id' => $orgId,
            'pulse_id'        => $pulseId,
            'third_party_id'  => (string) Str::uuid(),
            'user_id'         => $userId,
            'type'            => 'taskAgent',
            'is_active'       => true,
        ]);

        $agent = new TaskAgent($pulse);

        $response = $agent->processMessage(
            collect([
                [
                    'content' => 'Create tasks from most recent meeting',
                ],
            ]),
            $thread,
            $user,
            $orgId,
        );
        Log::debug($response);
        $this->assertIsString($response);
        $this->assertNotEmpty($response);
    }

    public function testTaskAgentCanCreateTaskFromMeetingWithSpecificDate()
    {
        $userId  = '9de646fb-614b-445d-8c93-cf1a35d6ce29';
        $pulseId = '4ed4d29e-79b7-4c0f-8ec0-b38b2fc18835';

        $user  = \App\Models\User::findOrFail($userId);
        $pulse = \App\Models\Pulse::findOrFail($pulseId);

        $orgId = $pulse->organization_id;

        $thread = \App\Models\Thread::create([
            'name'            => 'Test Task Agent Thread',
            'organization_id' => $orgId,
            'pulse_id'        => $pulseId,
            'third_party_id'  => (string) Str::uuid(),
            'user_id'         => $userId,
            'type'            => 'taskAgent',
            'is_active'       => true,
        ]);

        $agent = new TaskAgent($pulse);

        $response = $agent->processMessage(
            collect([
                [
                    'content' => 'Create tasks from Zunou stand up meeting, March 20',
                ],
            ]),
            $thread,
            $user,
            $orgId,
        );
        Log::debug($response);
        $this->assertIsString($response);
        $this->assertNotEmpty($response);
    }

    public function testTaskAgentCanSummarizeExplainAndHelpTasks()
    {
        $userId  = '9de646fb-614b-445d-8c93-cf1a35d6ce29';
        $pulseId = '4ed4d29e-79b7-4c0f-8ec0-b38b2fc18835';

        $user  = \App\Models\User::findOrFail($userId);
        $pulse = \App\Models\Pulse::findOrFail($pulseId);

        $orgId = $pulse->organization_id;

        $thread = \App\Models\Thread::create([
            'name'            => 'Test Task Agent Thread',
            'organization_id' => $orgId,
            'pulse_id'        => $pulseId,
            'third_party_id'  => (string) Str::uuid(),
            'user_id'         => $userId,
            'type'            => 'taskAgent',
            'is_active'       => true,
        ]);

        $agent = new TaskAgent($pulse);

        $response = $agent->processMessage(
            collect([
                [
                    'content' => 'Create tasks from Zunou stand up meeting, March 20',
                ],
            ]),
            $thread,
            $user,
            $orgId,
        );

        $response = $agent->processMessage(
            collect([
                [
                    'content' => 'Summarize the tasks for me',
                ],
            ]),
            $thread,
            $user,
            $orgId,
        );

        Log::debug($response);
        $this->assertIsString($response);
        $this->assertNotEmpty($response);

        $response = $agent->processMessage(
            collect([
                [
                    'content' => 'Explain the tasks for me',
                ],
            ]),
            $thread,
            $user,
            $orgId,
        );

        Log::debug($response);
        $this->assertIsString($response);
        $this->assertNotEmpty($response);

        $response = $agent->processMessage(
            collect([
                [
                    'content' => 'Can you help me on the tasks',
                ],
            ]),
            $thread,
            $user,
            $orgId,
        );

        Log::debug($response);
        $this->assertIsString($response);
        $this->assertNotEmpty($response);
    }

    public function testTaskAgentCanCreateTaskFromMeetingWithSemanticSearch()
    {
        $userId  = '9de646fb-614b-445d-8c93-cf1a35d6ce29';
        $pulseId = '4ed4d29e-79b7-4c0f-8ec0-b38b2fc18835';

        $user  = \App\Models\User::findOrFail($userId);
        $pulse = \App\Models\Pulse::findOrFail($pulseId);

        $orgId = $pulse->organization_id;

        $thread = \App\Models\Thread::create([
            'name'            => 'Test Task Agent Thread',
            'organization_id' => $orgId,
            'pulse_id'        => $pulseId,
            'third_party_id'  => (string) Str::uuid(),
            'user_id'         => $userId,
            'type'            => 'taskAgent',
            'is_active'       => true,
        ]);

        $agent = new TaskAgent($pulse);

        $response = $agent->processMessage(
            collect([
                [
                    'content' => 'Create tasks from Zunou stand up meeting',
                ],
            ]),
            $thread,
            $user,
            $orgId,
        );
        Log::debug($response);
        $this->assertIsString($response);
        $this->assertNotEmpty($response);
    }

    public function testCreateTasksShouldNotThrowArgumentsRelatedError()
    {
        $pulseId = '4642613b-c9e1-4ef9-9b1b-30d7e8fd5b42';
        $pulse   = \App\Models\Pulse::findOrFail($pulseId);
        $agent   = new TaskAgent($pulse);

        /** Task assignee where user name or id do not exist should not throw error */
        $tasks = [
            [
                'title'       => 'Create Websocket API',
                'description' => 'Develop a Websocket API as discussed. Please ensure all endpoints and connection-tested.',
                'assignees'   => [
                    [
                        'id'   => 'a1',
                        'name' => 'Kevin',
                    ],
                ],
                'status'    => 'TODO',
                'priority'  => 'HIGH',
                'due_date'  => '2025-05-11 17:00:00',
                'task_type' => 'TASK',
                'parent_id' => null,
            ],
        ];

        $actual   = $agent->validateTasks($tasks, $pulseId);
        $expected = [
            [
                'title'       => 'Create Websocket API',
                'description' => 'Develop a Websocket API as discussed. Please ensure all endpoints and connection-tested.',
                'assignees'   => [],
                'status'      => 'TODO',
                'priority'    => 'HIGH',
                'due_date'    => '2025-05-11 17:00:00',
                'task_type'   => 'TASK',
                'parent_id'   => null,
            ],
        ];

        $this->assertEqualsCanonicalizing($expected, $actual);

        /** Task assignee name and id should be populated with db name and id */
        $tasks = [
            [
                'title'       => 'Create Websocket API',
                'description' => 'Develop a Websocket API as discussed. Please ensure all endpoints and connection-tested.',
                'assignees'   => [
                    [
                        'id'   => '',
                        'name' => 'Jose',
                    ],
                ],
                'status'    => 'TODO',
                'priority'  => 'HIGH',
                'due_date'  => '2025-05-11 17:00:00',
                'task_type' => 'TASK',
                'parent_id' => null,
            ],
        ];

        $actual   = $agent->validateTasks($tasks, $pulseId);
        $expected = [
            [
                'title'       => 'Create Websocket API',
                'description' => 'Develop a Websocket API as discussed. Please ensure all endpoints and connection-tested.',
                'assignees'   => [
                    [
                        'id'   => '9de646fb-614b-445d-8c93-cf1a35d6ce29',
                        'name' => 'Jose Sarmiento',
                    ],
                ],
                'status'    => 'TODO',
                'priority'  => 'HIGH',
                'due_date'  => '2025-05-11 17:00:00',
                'task_type' => 'TASK',
                'parent_id' => null,
            ],
        ];

        $this->assertEqualsCanonicalizing($expected, $actual);

        /** Invalid Task due date  should not throw error*/
        $tasks = [
            [
                'title'       => 'Create Websocket API',
                'description' => 'Develop a Websocket API as discussed. Please ensure all endpoints and connection-tested.',
                'assignees'   => [
                    [
                        'id'   => '9de646fb-614b-445d-8c93-cf1a35d6ce29',
                        'name' => 'Jose Sarmiento',
                    ],
                ],
                'status'    => 'TODO',
                'priority'  => 'HIGH',
                'due_date'  => '2025-05-11 17:00:00',
                'task_type' => 'TASK',
                'parent_id' => null,
            ],
            [
                'title'       => 'Create Websocket API',
                'description' => 'Develop a Websocket API as discussed. Please ensure all endpoints and connection-tested.',
                'assignees'   => [
                    [
                        'id'   => '9de646fb-614b-445d-8c93-cf1a35d6ce29',
                        'name' => 'Jose Sarmiento',
                    ],
                ],
                'status'    => 'TODO',
                'priority'  => 'HIGH',
                'due_date'  => '2025-05-11Zy 17:00:00',
                'task_type' => 'TASK',
                'parent_id' => null,
            ],
            [
                'title'       => 'Create Websocket API',
                'description' => 'Develop a Websocket API as discussed. Please ensure all endpoints and connection-tested.',
                'assignees'   => [
                    [
                        'id'   => '9de646fb-614b-445d-8c93-cf1a35d6ce29',
                        'name' => 'Jose Sarmiento',
                    ],
                ],
                'status'    => 'TODO',
                'priority'  => 'HIGH',
                'due_date'  => '',
                'task_type' => 'TASK',
                'parent_id' => null,
            ],
        ];

        $actual   = $agent->validateTasks($tasks, $pulseId);
        $expected = [
            [
                'title'       => 'Create Websocket API',
                'description' => 'Develop a Websocket API as discussed. Please ensure all endpoints and connection-tested.',
                'assignees'   => [
                    [
                        'id'   => '9de646fb-614b-445d-8c93-cf1a35d6ce29',
                        'name' => 'Jose Sarmiento',
                    ],
                ],
                'status'    => 'TODO',
                'priority'  => 'HIGH',
                'due_date'  => '2025-05-11 17:00:00',
                'task_type' => 'TASK',
                'parent_id' => null,
            ],
            [
                'title'       => 'Create Websocket API',
                'description' => 'Develop a Websocket API as discussed. Please ensure all endpoints and connection-tested.',
                'assignees'   => [
                    [
                        'id'   => '9de646fb-614b-445d-8c93-cf1a35d6ce29',
                        'name' => 'Jose Sarmiento',
                    ],
                ],
                'status'    => 'TODO',
                'priority'  => 'HIGH',
                'due_date'  => null,
                'task_type' => 'TASK',
                'parent_id' => null,
            ],
            [
                'title'       => 'Create Websocket API',
                'description' => 'Develop a Websocket API as discussed. Please ensure all endpoints and connection-tested.',
                'assignees'   => [
                    [
                        'id'   => '9de646fb-614b-445d-8c93-cf1a35d6ce29',
                        'name' => 'Jose Sarmiento',
                    ],
                ],
                'status'    => 'TODO',
                'priority'  => 'HIGH',
                'due_date'  => null,
                'task_type' => 'TASK',
                'parent_id' => null,
            ],
        ];

        $this->assertEqualsCanonicalizing($expected, $actual);
    }
}
