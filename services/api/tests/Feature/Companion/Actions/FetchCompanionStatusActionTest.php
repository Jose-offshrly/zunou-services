<?php

declare(strict_types=1);

namespace Tests\Feature\Companion\Actions;

use App\Actions\MeetingSession\FetchCompanionStatusAction;
use App\Models\MeetingSession;
use App\Models\Pulse;
use Tests\TestCase;

class FetchCompanionStatusActionTest extends TestCase
{
    public function test_can_fetch_companion_statuses(): void
    {
        $pulse = Pulse::find(env('TEST_PULSE'));

        $action = app(FetchCompanionStatusAction::class);

        $meetingSessions = $action->handle(pulse: $pulse);

        $this->assertContainsOnlyInstancesOf(MeetingSession::class, $meetingSessions);
        $this->assertNotNull($meetingSessions);
    }
}
