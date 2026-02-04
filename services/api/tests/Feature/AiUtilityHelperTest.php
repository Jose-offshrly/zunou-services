<?php

namespace Tests\Feature;

use App\Helpers\AiUtilityHelper;
use Tests\TestCase;

class AiUtilityHelperTest extends TestCase
{
    /**
     * A basic feature test example.
     */
    public function test_it_should_properly_ordered_the_messages_if_tool_calls_and_tools_get_switched_place(): void
    {
        $inputMessages = [
            [
                'content'      => 'give me 5 short stories listed in document',
                'role'         => 'user',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                'is_system'    => true,
            ],
            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],
        ];

        $expected = [
            [
                'content'      => 'give me 5 short stories listed in document',
                'role'         => 'user',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],
            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                'is_system'    => true,
            ],
        ];

        $actual = AiUtilityHelper::reorderMessages($inputMessages);
        $this->assertEquals($expected, $actual);
    }

    public function test_it_should_properly_order_tool_messages_even_if_there_is_other_message_types_in_between(): void
    {
        $inputMessages = [
            [
                'content'      => 'give me 5 short stories listed in document',
                'role'         => 'user',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                'is_system'    => true,
            ],
        ];

        $expected = [
            [
                'content'      => 'give me 5 short stories listed in document',
                'role'         => 'user',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],
            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                'is_system'    => true,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
        ];

        $actual = AiUtilityHelper::reorderMessages($inputMessages);
        $this->assertEquals($expected, $actual);
    }

    public function test_it_should_properly_ordered_even_if_messages_contains_multiple_tool_messages(): void
    {
        $inputMessages = [
            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                'is_system'    => true,
            ],
            [
                'content'      => 'give me 5 short stories listed in document',
                'role'         => 'user',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],

            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUfpp',
                'is_system'    => true,
            ],
            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUfpp',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
        ];

        $expected = [
            [
                'content'      => 'give me 5 short stories listed in document',
                'role'         => 'user',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],
            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                'is_system'    => true,
            ],
            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUfpp',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],
            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUfpp',
                'is_system'    => true,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
        ];

        $actual = AiUtilityHelper::reorderMessages($inputMessages);
        $this->assertEquals($expected, $actual);
    }

    public function test_it_should_properly_ordered_even_if_tool_indexed_is_change_while_sorting(): void
    {
        $inputMessages = [
            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUfpp',
                'is_system'    => true,
            ],
            [
                'content'      => 'give me 5 short stories listed in document',
                'role'         => 'user',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                'is_system'    => true,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUfpp',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],

            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
        ];

        $expected = [
            [
                'content'      => 'give me 5 short stories listed in document',
                'role'         => 'user',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],

            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUfpp',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],
            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUfpp',
                'is_system'    => true,
            ],
            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],
            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUfp',
                'is_system'    => true,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
            [
                'content'      => 'content',
                'role'         => 'assistant',
                'tool_calls'   => null,
                'tool_call_id' => null,
                'is_system'    => false,
            ],
        ];

        $actual = AiUtilityHelper::reorderMessages($inputMessages);
        $this->assertEquals($expected, $actual);
    }

    public function test_it_should_properly_ordered_even_if_tool_indexed_is_change_at_the_right_side_while_sorting(): void
    {
        $inputMessages = [
            [
                'content'   => 'content',
                'role'      => 'assistant',
                'is_system' => false,
            ],
            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUkkk',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],
            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUsss',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],
            [
                'content'   => 'content',
                'role'      => 'assistant',
                'is_system' => false,
            ],
            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUsss',
                'is_system'    => true,
            ],
            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUkkk',
                'is_system'    => true,
            ],
        ];

        $expected = [
            [
                'content'   => 'content',
                'role'      => 'assistant',
                'is_system' => false,
            ],
            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUkkk',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],
            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUkkk',
                'is_system'    => true,
            ],
            [
                'content'    => null,
                'role'       => 'assistant',
                'tool_calls' => [
                    [
                        'id'       => 'call_hB9LEnibLKKEnEkuzPIoUUsss',
                        'type'     => 'function',
                        'function' => [
                            'name'      => 'findDataSource',
                            'arguments' => json_encode([
                                'query' => 'short stories listed in document',
                            ]),
                        ],
                    ],
                ],
                'tool_call_id' => null,
                'is_system'    => true,
            ],
            [
                'content'      => 'Document Name: 2de6-43fd-8665-9ba20a95a6e0.pdf',
                'role'         => 'tool',
                'tool_calls'   => null,
                'tool_call_id' => 'call_hB9LEnibLKKEnEkuzPIoUUsss',
                'is_system'    => true,
            ],
            [
                'content'   => 'content',
                'role'      => 'assistant',
                'is_system' => false,
            ],
        ];
        $actual = AiUtilityHelper::reorderMessages($inputMessages);
        $this->assertEquals($expected, $actual);
    }
}
