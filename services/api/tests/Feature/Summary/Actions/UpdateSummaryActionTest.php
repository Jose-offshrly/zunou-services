<?php

namespace Feature\Summary\Actions;

use App\Actions\Summary\UpdateSummaryAction;
use App\DataTransferObjects\SummaryData;
use App\Models\Summary;
use Tests\TestCase;

class UpdateSummaryActionTest extends TestCase
{
    public function test_it_can_update_the_given_summary_resource()
    {
        $action  = app(UpdateSummaryAction::class);
        $summary = Summary::factory()->create();
        $data    = new SummaryData(
            summary: 'Updated summary',
            name: 'Updated name',
        );

        $summary = $action->handle(data: $data, summary: $summary);

        $this->assertInstanceOf(Summary::class, $summary);
        $this->assertEquals(
            expected: [
                ...$summary->toArray(),
                'summary' => 'Updated summary',
                'name'    => 'Updated name',
            ],
            actual: $summary->toArray(),
        );
    }
}
