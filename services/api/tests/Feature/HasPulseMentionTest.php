<?php

namespace Tests\Feature;

use App\Helpers\StringHelper;
use Tests\TestCase;

class HasPulseMentionTest extends TestCase
{
    public function test_has_pulse_mention()
    {
        $tests = [
            // Should match
            [
                // Original (from your question)
                "[{\"type\":\"paragraph\",\"children\":[{\"text\":\"\"},{\"type\":\"mention\",\"mention\":{\"id\":\"pulse\",\"name\":\"pulse\"},\"children\":[{\"text\":\"\"}]},{\"text\":\" this is it\"},{\"text\":\"\"}]}]",
                true,
            ],
            [
                '[{"type":"mention","mention":{"id":"pulse"}}]',
                true,
            ],
            [
                '[{\"type\":\"mention\",\"mention\":{\"id\":\"pulse\"}}]',
                true,
            ],
            [
                '[{&quot;type&quot;:&quot;mention&quot;,&quot;mention&quot;:{&quot;id&quot;:&quot;pulse&quot;}}]',
                true,
            ],
            [
                "[
                   {
                     \"type\" : \"mention\",
                     \"mention\" : {
                         \"id\" : \"pulse\",
                         \"name\" : \"Pulse\"
                     }
                   }
                ]",
                true,
            ],
            [
                "[
                   {
                     \"type\" : \"mention\",
                     \"mention\" : {
                         \"id\" : \"pulse\",
                         \"name\" : \"Pulse\"
                     }
                   }
                ]",
                true,
            ],
            [
                '{"type":"paragraph","children":[{"type":"mention","mention":{"id":"pulse"}}]}',
                true,
            ],

            // Should NOT match
            [
                '[{"type":"mention","mention":{"id":"pulsed"}}]',
                false,
            ],
            [
                '[{"type":"tag","mention":{"id":"pulse"}}]',
                false,
            ],
            [
                "this is pulse but not a mention",
                false,
            ],
        ];

        foreach ($tests as [$input, $expected]) {
            $result = StringHelper::hasPulseMention($input);

            $this->assertSame(
                $expected,
                $result,
                "Failed asserting that input matches expected value:\n$input"
            );
        }
    }
}
