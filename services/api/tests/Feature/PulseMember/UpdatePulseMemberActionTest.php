<?php

declare(strict_types=1);

namespace Tests\Feature\PulseMember;

use App\Actions\PulseMember\UpdatePulseMemberAction;
use App\DataTransferObjects\PulseMemberData;
use App\Models\PulseMember;
use Tests\TestCase;

class UpdatePulseMemberActionTest extends TestCase
{
    public function test_it_can_update_a_given_pulse_member(): void
    {
        $member = PulseMember::first();
        $data   = new PulseMemberData(
            job_description: 'job',
            responsibilities: ['work'],
        );

        $action = app(UpdatePulseMemberAction::class);

        $member = $action->handle(data: $data, member: $member);

        $this->assertInstanceOf(PulseMember::class, $member);
        $this->assertEquals('job', $member->job_description);
        $this->assertContains('work', $member->responsibilities);
    }
}
