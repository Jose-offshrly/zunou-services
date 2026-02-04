<?php

declare(strict_types=1);

namespace Tests\Feature\OrganizationGroup;

use App\Actions\OrganizationGroup\CreateOrganizationGroupMemberAction;
use App\Models\OrganizationGroup;
use App\Models\PulseMember;
use Tests\TestCase;

class AddOrganizationGroupMemberActionTest extends TestCase
{
    public function test_it_can_add_a_new_member_to_the_group(): void
    {
        $group  = OrganizationGroup::first();
        $member = PulseMember::first();

        $action = app(CreateOrganizationGroupMemberAction::class);

        $action->handle(group: $group, member: $member);

        $this->assertDatabaseCount('organization_group_pulse_member', 1);
    }
}
