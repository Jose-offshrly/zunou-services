<?php

namespace Feature\Summary\Actions;

use App\Actions\Summary\GenerateSummaryOptionsAction;
use App\Models\Summary;
use App\Models\Thread;
use Tests\TestCase;

class GenerateSummaryOptionsActionTest extends TestCase
{
    public function test_it_can_generate_summary_options_for_the_given_meeting()
    {
        $summary = Summary::first();
        $thread  = Thread::first();

        $action = new GenerateSummaryOptionsAction(
            summary: $summary,
            thread: $thread,
        );

        $message = $action->handle();

        $this->assertDatabaseHas(
            'messages',
            $message->makeHidden(['is_saved'])->toArray(),
        );

        $this->assertObjectHasProperty(
            'summary',
            app(GenerateSummaryOptionsAction::class),
        );
        $this->assertObjectHasProperty(
            'thread',
            app(GenerateSummaryOptionsAction::class),
        );

        $this->assertDatabaseCount('messages', 2);
    }
}
