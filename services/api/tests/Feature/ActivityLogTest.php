<?php

namespace Tests\Feature;

use App\Services\ActivityLogMessageProcessor;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    public function test_activity_log_injection_with_mock_data(): void
    {
        $mockMessages = $this->createMockMessages();
        $mockActivityLogs = $this->createMockActivityLogs();
        
        $processor = new ActivityLogMessageProcessor();
        $mergedMessages = $processor->processMessagesWithActivityLogs($mockMessages, $mockActivityLogs);
        
        $this->assertCount(8, $mergedMessages); // 5 original + 3 activity logs
        
        // Check that we have the right number of each type
        $userMessages = array_filter($mergedMessages, function($msg) { return $msg['role'] === 'user'; });
        $assistantMessages = array_filter($mergedMessages, function($msg) { return $msg['role'] === 'assistant'; });
        $systemMessages = array_filter($mergedMessages, function($msg) { return $msg['role'] === 'system'; });
        
        $this->assertCount(3, $userMessages);
        $this->assertCount(2, $assistantMessages);
        $this->assertCount(3, $systemMessages);
        
        // Check that activities are inserted and have the right content
        $activityContents = array_map(function($msg) { return $msg['content']; }, $systemMessages);
        $allContent = implode(' ', $activityContents);
        $this->assertStringContainsString('Task updated', $allContent);
        $this->assertStringContainsString('Task completed', $allContent);
        $this->assertStringContainsString('Task assigned', $allContent);

        $expectedMessages = $this->expectedMessagesForTestActivityLogInjectionWithMockData();
        $this->assertEquals($mergedMessages, $expectedMessages);
    }

    private function expectedMessagesForTestActivityLogInjectionWithMockData(): array
    {
        return [
            [
                'role' => 'user',
                'content' => 'Give me open tasks',
                'created_at' => '2025-01-01 10:00:00',
                'updated_at' => '2025-01-01 10:00:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'assistant',
                'content' => 'You have 3 open tasks',
                'created_at' => '2025-01-01 10:01:00',
                'updated_at' => '2025-01-01 10:01:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'system',
                'content' => 'Task updated: "Complete project documentation" (status: completed)',
                'tool_calls' => null,
                'tool_call_id' => null,
                'created_at' => '2025-01-01 10:01:20',
                'updated_at' => '2025-01-01 10:01:20',
            ],
            [
                'role' => 'user',
                'content' => 'Give me open tasks again',
                'created_at' => '2025-01-01 10:05:00',
                'updated_at' => '2025-01-01 10:05:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'assistant',
                'content' => 'You still have 3 open tasks',
                'created_at' => '2025-01-01 10:06:00',
                'updated_at' => '2025-01-01 10:06:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'system',
                'content' => 'Task completed: "Review code changes"',
                'created_at' => '2025-01-01 10:07:00',
                'updated_at' => '2025-01-01 10:07:00',
                'tool_calls' => null,
                'tool_call_id' => null,
            ],
            [
                'role' => 'user',
                'content' => 'What about now?',
                'created_at' => '2025-01-01 10:10:00',
                'updated_at' => '2025-01-01 10:10:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'system',
                'content' => 'Task assigned: "Fix bug in login system" to John Doe',
                'created_at' => '2025-01-01 10:12:00',
                'updated_at' => '2025-01-01 10:12:00',
                'tool_calls' => null,
                'tool_call_id' => null,
            ],
        ];
    }

    public function test_activity_log_injection_with_tool_calls(): void
    {
        $mockMessages = $this->createMockMessagesWithToolCalls();
        $mockActivityLogs = $this->createMockActivityLogs();
        
        $processor = new ActivityLogMessageProcessor();
        $mergedMessages = $processor->processMessagesWithActivityLogs($mockMessages, $mockActivityLogs);
        
        $this->assertCount(10, $mergedMessages); // 7 original + 3 activity logs
        
        $userMessages = array_filter($mergedMessages, function($msg) { return $msg['role'] === 'user'; });
        $assistantMessages = array_filter($mergedMessages, function($msg) { return $msg['role'] === 'assistant'; });
        $toolMessages = array_filter($mergedMessages, function($msg) { return $msg['role'] === 'tool'; });
        $systemMessages = array_filter($mergedMessages, function($msg) { return $msg['role'] === 'system'; });
        
        $this->assertCount(2, $userMessages);
        $this->assertCount(3, $assistantMessages); // Fixed: 3 assistant messages in original data
        $this->assertCount(2, $toolMessages);
        $this->assertCount(3, $systemMessages); // 3 activities (no extra system message)
        
        // Check that tool call sequence is preserved (find assistant with tool calls)
        $assistantWithToolCalls = array_filter($assistantMessages, function($msg) { 
            return isset($msg['tool_calls']) && $msg['tool_calls'] !== null; 
        });
        $this->assertNotEmpty($assistantWithToolCalls);
        
        // Check that activities are inserted and have the right content
        $activityContents = array_map(function($msg) { return $msg['content']; }, $systemMessages);
        $allContent = implode(' ', $activityContents);
        $this->assertStringContainsString('Task updated', $allContent);
        $this->assertStringContainsString('Task completed', $allContent);
        $this->assertStringContainsString('Task assigned', $allContent);
        
        $expectedMessages = $this->expectedMessagesForTestActivityLogInjectionWithToolCalls();
        $this->assertEquals($mergedMessages, $expectedMessages);
    }

    private function expectedMessagesForTestActivityLogInjectionWithToolCalls(): array
    {
        return [
            [
                'role' => 'user',
                'content' => 'Get my tasks',
                'created_at' => '2025-01-01 10:00:00',
                'updated_at' => '2025-01-01 10:00:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'assistant',
                'content' => 'I\'ll get your tasks for you.',
                'created_at' => '2025-01-01 10:01:00',
                'updated_at' => '2025-01-01 10:01:00',
                'tool_calls' => [
                    [
                        'id' => 'call_1',
                        'type' => 'function',
                        'function' => [
                            'name' => 'get_tasks',
                            'arguments' => '{}'
                        ]
                    ]
                ],
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'tool',
                'content' => '{"tasks": [{"id": 1, "title": "Task 1"}]}',
                'created_at' => '2025-01-01 10:01:30',
                'updated_at' => '2025-01-01 10:01:30',
                'tool_calls' => null,
                'tool_call_id' => 'call_1',
                'metadata' => [],
            ],
            [
                'role' => 'assistant',
                'content' => 'You have 1 task: Task 1',
                'created_at' => '2025-01-01 10:02:00',
                'updated_at' => '2025-01-01 10:02:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'system',
                'content' => 'Task updated: "Complete project documentation" (status: completed)',
                'created_at' => '2025-01-01 10:01:20',
                'updated_at' => '2025-01-01 10:01:20',
                'tool_calls' => null,
                'tool_call_id' => null,
            ],
            [
                'role' => 'user',
                'content' => 'Update task 1',
                'created_at' => '2025-01-01 10:05:00',
                'updated_at' => '2025-01-01 10:05:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'assistant',
                'content' => 'I\'ll update task 1 for you.',
                'created_at' => '2025-01-01 10:06:00',
                'updated_at' => '2025-01-01 10:06:00',
                'tool_calls' => [
                    [
                        'id' => 'call_2',
                        'type' => 'function',
                        'function' => [
                            'name' => 'update_task',
                            'arguments' => '{"id": 1, "status": "completed"}'
                        ]
                    ]
                ],
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'tool',
                'content' => '{"success": true}',
                'created_at' => '2025-01-01 10:06:30',
                'updated_at' => '2025-01-01 10:06:30',
                'tool_calls' => null,
                'tool_call_id' => 'call_2',
                'metadata' => [],
            ],
            [
                'role' => 'system',
                'content' => 'Task completed: "Review code changes"',
                'created_at' => '2025-01-01 10:07:00',
                'updated_at' => '2025-01-01 10:07:00',
                'tool_calls' => null,
                'tool_call_id' => null,
            ],
            [
                'role' => 'system',
                'content' => 'Task assigned: "Fix bug in login system" to John Doe',
                'created_at' => '2025-01-01 10:12:00',
                'updated_at' => '2025-01-01 10:12:00',
                'tool_calls' => null,
                'tool_call_id' => null,
            ],
        ];
    }

    public function test_activities_before_first_user_message(): void
    {
        $mockMessages = [
            [
                'role' => 'user',
                'content' => 'Hello',
                'created_at' => '2025-01-01 10:00:00',
                'updated_at' => '2025-01-01 10:00:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
        ];
        
        $mockActivityLogs = [
            [
                'id' => '1',
                'description' => 'Activity before user',
                'created_at' => '2025-01-01 09:00:00', // Before user
                'updated_at' => '2025-01-01 09:00:00',
                'causer' => [
                    'id' => 'user1',
                    'name' => 'John Doe',
                    'timezone' => 'UTC',
                ],
            ],
        ];
        
        $processor = new ActivityLogMessageProcessor();
        $mergedMessages = $processor->processMessagesWithActivityLogs($mockMessages, $mockActivityLogs);
        
        // Should have 2 messages: user, activity (at end)
        $this->assertCount(2, $mergedMessages);
        
        $userMessages = array_filter($mergedMessages, function($msg) { return $msg['role'] === 'user'; });
        $systemMessages = array_filter($mergedMessages, function($msg) { return $msg['role'] === 'system'; });
        
        $this->assertCount(1, $userMessages);
        $this->assertCount(1, $systemMessages);
    }

    /**
     * Test edge case: complex tool call sequences
     */
    public function test_complex_tool_call_sequences(): void
    {
        $mockMessages = [
            [
                'role' => 'user',
                'content' => 'Complex task',
                'created_at' => '2025-01-01 10:00:00',
                'updated_at' => '2025-01-01 10:00:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'assistant',
                'content' => 'I\'ll help with multiple tools',
                'created_at' => '2025-01-01 10:01:00',
                'updated_at' => '2025-01-01 10:01:00',
                'tool_calls' => [
                    [
                        'id' => 'call_1',
                        'type' => 'function',
                        'function' => ['name' => 'tool1', 'arguments' => '{}']
                    ],
                    [
                        'id' => 'call_2', 
                        'type' => 'function',
                        'function' => ['name' => 'tool2', 'arguments' => '{}']
                    ]
                ],
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'tool',
                'content' => 'Tool 1 result',
                'created_at' => '2025-01-01 10:01:30',
                'updated_at' => '2025-01-01 10:01:30',
                'tool_calls' => null,
                'tool_call_id' => 'call_1',
                'metadata' => [],
            ],
            [
                'role' => 'tool',
                'content' => 'Tool 2 result',
                'created_at' => '2025-01-01 10:01:45',
                'updated_at' => '2025-01-01 10:01:45',
                'tool_calls' => null,
                'tool_call_id' => 'call_2',
                'metadata' => [],
            ],
            [
                'role' => 'assistant',
                'content' => 'Combined results',
                'created_at' => '2025-01-01 10:02:00',
                'updated_at' => '2025-01-01 10:02:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
        ];
        
        $mockActivityLogs = [
            [
                'id' => '1',
                'description' => 'Activity during tool calls',
                'created_at' => '2025-01-01 10:01:35', // Between tool calls
                'updated_at' => '2025-01-01 10:01:35',
                'causer' => [
                    'id' => 'user1',
                    'name' => 'John Doe',
                    'timezone' => 'UTC',
                ],
            ],
        ];
        
        $processor = new ActivityLogMessageProcessor();
        $mergedMessages = $processor->processMessagesWithActivityLogs($mockMessages, $mockActivityLogs);
        
        // Should preserve tool call sequence: user -> assistant -> tool -> tool -> assistant -> activity
        $this->assertCount(6, $mergedMessages);
        
        $userMessages = array_filter($mergedMessages, function($msg) { return $msg['role'] === 'user'; });
        $assistantMessages = array_filter($mergedMessages, function($msg) { return $msg['role'] === 'assistant'; });
        $toolMessages = array_filter($mergedMessages, function($msg) { return $msg['role'] === 'tool'; });
        $systemMessages = array_filter($mergedMessages, function($msg) { return $msg['role'] === 'system'; });
        
        $this->assertCount(1, $userMessages);
        $this->assertCount(2, $assistantMessages);
        $this->assertCount(2, $toolMessages);
        $this->assertCount(1, $systemMessages);
    }

    private function createMockMessages(): array
    {
        return [
            [
                'role' => 'user',
                'content' => 'Give me open tasks',
                'created_at' => '2025-01-01 10:00:00',
                'updated_at' => '2025-01-01 10:00:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'assistant',
                'content' => 'You have 3 open tasks',
                'created_at' => '2025-01-01 10:01:00',
                'updated_at' => '2025-01-01 10:01:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'user',
                'content' => 'Give me open tasks again',
                'created_at' => '2025-01-01 10:05:00',
                'updated_at' => '2025-01-01 10:05:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'assistant',
                'content' => 'You still have 3 open tasks',
                'created_at' => '2025-01-01 10:06:00',
                'updated_at' => '2025-01-01 10:06:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'user',
                'content' => 'What about now?',
                'created_at' => '2025-01-01 10:10:00',
                'updated_at' => '2025-01-01 10:10:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
        ];
    }

    private function createMockMessagesWithToolCalls(): array
    {
        return [
            [
                'role' => 'user',
                'content' => 'Get my tasks',
                'created_at' => '2025-01-01 10:00:00',
                'updated_at' => '2025-01-01 10:00:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'assistant',
                'content' => 'I\'ll get your tasks for you.',
                'created_at' => '2025-01-01 10:01:00',
                'updated_at' => '2025-01-01 10:01:00',
                'tool_calls' => [
                    [
                        'id' => 'call_1',
                        'type' => 'function',
                        'function' => [
                            'name' => 'get_tasks',
                            'arguments' => '{}'
                        ]
                    ]
                ],
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'tool',
                'content' => '{"tasks": [{"id": 1, "title": "Task 1"}]}',
                'created_at' => '2025-01-01 10:01:30',
                'updated_at' => '2025-01-01 10:01:30',
                'tool_calls' => null,
                'tool_call_id' => 'call_1',
                'metadata' => [],
            ],
            [
                'role' => 'assistant',
                'content' => 'You have 1 task: Task 1',
                'created_at' => '2025-01-01 10:02:00',
                'updated_at' => '2025-01-01 10:02:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'user',
                'content' => 'Update task 1',
                'created_at' => '2025-01-01 10:05:00',
                'updated_at' => '2025-01-01 10:05:00',
                'tool_calls' => null,
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'assistant',
                'content' => 'I\'ll update task 1 for you.',
                'created_at' => '2025-01-01 10:06:00',
                'updated_at' => '2025-01-01 10:06:00',
                'tool_calls' => [
                    [
                        'id' => 'call_2',
                        'type' => 'function',
                        'function' => [
                            'name' => 'update_task',
                            'arguments' => '{"id": 1, "status": "completed"}'
                        ]
                    ]
                ],
                'tool_call_id' => null,
                'metadata' => [],
            ],
            [
                'role' => 'tool',
                'content' => '{"success": true}',
                'created_at' => '2025-01-01 10:06:30',
                'updated_at' => '2025-01-01 10:06:30',
                'tool_calls' => null,
                'tool_call_id' => 'call_2',
                'metadata' => [],
            ],
        ];
    }

    private function createMockActivityLogs(): array
    {
        return [
            [
                'id' => '1',
                'description' => 'Task updated: "Complete project documentation" (status: completed)',
                'created_at' => '2025-01-01 10:01:20', // After first user message, before second
                'updated_at' => '2025-01-01 10:01:20',
                'causer' => [
                    'id' => 'user1',
                    'name' => 'John Doe',
                    'timezone' => 'UTC',
                ],
            ],
            [
                'id' => '2',
                'description' => 'Task completed: "Review code changes"',
                'created_at' => '2025-01-01 10:07:00', // After second user message, before third
                'updated_at' => '2025-01-01 10:07:00',
                'causer' => [
                    'id' => 'user2',
                    'name' => 'Jane Smith',
                    'timezone' => 'America/New_York',
                ],
            ],
            [
                'id' => '3',
                'description' => 'Task assigned: "Fix bug in login system" to John Doe',
                'created_at' => '2025-01-01 10:12:00', // After third user message
                'updated_at' => '2025-01-01 10:12:00',
                'causer' => [
                    'id' => 'user3',
                    'name' => 'Bob Wilson',
                    'timezone' => 'Europe/London',
                ],
            ],
        ];
    }
}
