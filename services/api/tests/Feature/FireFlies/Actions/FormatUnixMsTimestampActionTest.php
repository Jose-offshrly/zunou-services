<?php

namespace Feature\FireFlies\Actions;

use App\Actions\Shared\FormatUnixTimestampAction;
use Tests\TestCase;

class FormatUnixMsTimestampActionTest extends TestCase
{
    /**
     * @throws \Exception
     */
    public function test_it_formats_unix_timestamp_in_milliseconds_to_date()
    {
        $action = app(FormatUnixTimestampAction::class);

        $date = $action->handle(unixTimestamp: '1737361200000');

        $this->assertEquals('2025-01-20 08:20:00', $date);
    }
}
