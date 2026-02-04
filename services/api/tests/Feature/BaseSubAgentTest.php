<?php

namespace Tests\Feature;

use App\Services\Agents\SubAgents\OrgChartAgent;
use Tests\TestCase;

class BaseSubAgentTest extends TestCase
{
    /**
     * A basic feature test example.
     */
    public function test_it_should_throw_openai_errors_if_assistant_message_is_duplicated_per_tool_response(): void
    {
        $threadId = 'd729e3f5-1b1f-47a7-b722-8ac25f9855dd';
        $pulseId  = '2fd01c1f-c723-48f4-934e-5da345a5ebc1';

        $pulse = \App\Models\Pulse::findOrFail($pulseId);
        $agent = new OrgChartAgent($pulse);

        $assistantMessage = [
            'role'       => 'assistant',
            'content'    => null,
            'tool_calls' => [
                [
                    'id'       => 'call_IEikF9m2v3ZArLEb8j2TqhFk',
                    'type'     => 'function',
                    'function' => [
                        'name'      => 'listGroupMembers',
                        'arguments' => json_encode([
                            'group_id' => '8afea8bf-9c1c-4db3-8479-f183a535846c',
                            'page'     => 1,
                            'per_page' => 50,
                        ]),
                    ],
                ],
                [
                    'id'       => 'call_oxz0zs7lpm9imUyrNdlOHtp8',
                    'type'     => 'function',
                    'function' => [
                        'name'      => 'listGroupMembers',
                        'arguments' => json_encode([
                            'group_id' => '1b9817a4-a610-462c-8fc8-055b0bdb1a35',
                            'page'     => 1,
                            'per_page' => 50,
                        ]),
                    ],
                ],
                [
                    'id'       => 'call_29JnAb4BNjBSDQ2jmeCQxkNI',
                    'type'     => 'function',
                    'function' => [
                        'name'      => 'listGroupMembers',
                        'arguments' => json_encode([
                            'group_id' => '9e67b623-2d12-4a9b-8949-2b6c0e82222f',
                            'page'     => 1,
                            'per_page' => 50,
                        ]),
                    ],
                ],
            ],
        ];

        $prevToolCallName = null;
        $messages         = [
            [
                'role'    => 'user',
                'content' => "org chart got updated, who's not belong in any group",
            ],
        ];

        $toolCalls = $assistantMessage['tool_calls'];

        $toolMessages = $agent->resolveToolCalls(
            $toolCalls,
            $threadId,
            $prevToolCallName,
        );
        foreach ($toolMessages as $toolMessage) {
            // Save tool call responses under one assistant message only
            $messages[] = $assistantMessage;
            $messages[] = [
                'role'         => 'tool',
                'tool_call_id' => $toolMessage['tool_call_id'],
                'content'      => $toolMessage['content'],
            ];
        }

        $req = [
            'model'    => config('zunou.openai.reasoning_model'),
            'messages' => $messages,
            'n'        => 1,
        ];

        $openAI = \OpenAI::client(config('zunou.openai.api_key'));

        $this->expectException(\Exception::class);
        $this->expectExceptionMessageMatches(
            '/^An assistant message with \'tool_calls\' must be followed by tool messages responding to each \'tool_call_id\'/',
        );

        $openAI->chat()->create($req);
    }

    public function test_it_should_proceed_even_if_arguments_is_invalid_but_with_error_message(): void
    {
        $threadId = 'd729e3f5-1b1f-47a7-b722-8ac25f9855dd';
        $pulseId  = '2fd01c1f-c723-48f4-934e-5da345a5ebc1';

        $pulse = \App\Models\Pulse::findOrFail($pulseId);
        $agent = new OrgChartAgent($pulse);

        $assistantMessage = [
            'role'       => 'assistant',
            'content'    => null,
            'tool_calls' => [
                [
                    'id'       => 'call_IEikF9m2v3ZArLEb8j2TqhFk',
                    'type'     => 'function',
                    'function' => [
                        'name'      => 'listGroupMembers',
                        'arguments' => '{\\::K"}',
                    ],
                ],
                [
                    'id'       => 'call_oxz0zs7lpm9imUyrNdlOHtp8',
                    'type'     => 'function',
                    'function' => [
                        'name'      => 'listGroupMembers',
                        'arguments' => json_encode([
                            'group_id' => '1b9817a4-a610-462c-8fc8-055b0bdb1a35',
                            'page'     => 1,
                            'per_page' => 50,
                        ]),
                    ],
                ],
                [
                    'id'       => 'call_29JnAb4BNjBSDQ2jmeCQxkNI',
                    'type'     => 'function',
                    'function' => [
                        'name'      => 'listGroupMembers',
                        'arguments' => json_encode([
                            'group_id' => '9e67b623-2d12-4a9b-8949-2b6c0e82222f',
                            'page'     => 1,
                            'per_page' => 50,
                        ]),
                    ],
                ],
            ],
        ];

        $prevToolCallName = null;
        $messages         = [
            [
                'role'    => 'user',
                'content' => "org chart got updated, who's not belong in any group",
            ],
            $assistantMessage,
        ];

        $toolCalls = $assistantMessage['tool_calls'];

        $toolMessages = $agent->resolveToolCalls(
            $toolCalls,
            $threadId,
            $prevToolCallName,
        );
        $this->assertEquals(
            'Arguments for this tool call cannot be parsed. Make sure the arguments are valid JSON.',
            $toolMessages[0]['content'],
        );
    }

    public function test_it_should_not_throw_openai_errors_if_assistant_has_multiple_tool_calls(): void
    {
        $threadId = 'd729e3f5-1b1f-47a7-b722-8ac25f9855dd';
        $pulseId  = '2fd01c1f-c723-48f4-934e-5da345a5ebc1';

        $pulse = \App\Models\Pulse::findOrFail($pulseId);
        $agent = new OrgChartAgent($pulse);

        $assistantMessage = [
            'role'       => 'assistant',
            'content'    => null,
            'tool_calls' => [
                [
                    'id'       => 'call_IEikF9m2v3ZArLEb8j2TqhFk',
                    'type'     => 'function',
                    'function' => [
                        'name'      => 'listGroupMembers',
                        'arguments' => json_encode([
                            'group_id' => '8afea8bf-9c1c-4db3-8479-f183a535846c',
                            'page'     => 1,
                            'per_page' => 50,
                        ]),
                    ],
                ],
                [
                    'id'       => 'call_oxz0zs7lpm9imUyrNdlOHtp8',
                    'type'     => 'function',
                    'function' => [
                        'name'      => 'listGroupMembers',
                        'arguments' => json_encode([
                            'group_id' => '1b9817a4-a610-462c-8fc8-055b0bdb1a35',
                            'page'     => 1,
                            'per_page' => 50,
                        ]),
                    ],
                ],
                [
                    'id'       => 'call_29JnAb4BNjBSDQ2jmeCQxkNI',
                    'type'     => 'function',
                    'function' => [
                        'name'      => 'listGroupMembers',
                        'arguments' => json_encode([
                            'group_id' => '9e67b623-2d12-4a9b-8949-2b6c0e82222f',
                            'page'     => 1,
                            'per_page' => 50,
                        ]),
                    ],
                ],
            ],
        ];

        $prevToolCallName = null;
        $messages         = [
            [
                'role'    => 'user',
                'content' => "org chart got updated, who's not belong in any group",
            ],
            $assistantMessage,
        ];

        $toolCalls = $assistantMessage['tool_calls'];

        $toolMessages = $agent->resolveToolCalls(
            $toolCalls,
            $threadId,
            $prevToolCallName,
        );
        foreach ($toolMessages as $toolMessage) {
            // Save tool call responses under one assistant message only
            $messages[] = [
                'role'         => 'tool',
                'tool_call_id' => $toolMessage['tool_call_id'],
                'content'      => $toolMessage['content'],
            ];
        }

        $req = [
            'model'    => config('zunou.openai.reasoning_model'),
            'messages' => $messages,
            'n'        => 1,
        ];

        $openAI = \OpenAI::client(config('zunou.openai.api_key'));

        $response = $openAI->chat()->create($req);

        $this->assertNotNull($response);
        $this->assertArrayHasKey('choices', (array) $response);
        $this->assertEquals($prevToolCallName, 'listGroupMembers');
    }
}
