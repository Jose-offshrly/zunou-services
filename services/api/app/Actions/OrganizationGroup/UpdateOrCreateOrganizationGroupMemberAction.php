<?php

declare(strict_types=1);

namespace App\Actions\OrganizationGroup;

use App\Models\OrganizationGroup;
use App\Models\PulseMember;
use Illuminate\Support\Facades\DB;

final class UpdateOrCreateOrganizationGroupMemberAction
{
    /*
      @param  array<int, int>  $orderedMemberIds
     */
    public function handle(
        ?OrganizationGroup $group,
        array $orderedMemberIds = [],
    ): void {
        if (! $group) {
            if (! empty($orderedMemberIds)) {
                // Detach only the specified members from all their current groups
                DB::table('organization_group_pulse_member') // or your pivot table name
                    ->whereIn('pulse_member_id', $orderedMemberIds)
                    ->delete();
            }

            return;
        }

        // Detach each member from all groups first
        PulseMember::whereIn('id', $orderedMemberIds)->each(
            fn (PulseMember $member) => $member->organizationGroups()->detach(),
        );

        // Build new pivot data with order values
        $syncData = collect($orderedMemberIds)
            ->mapWithKeys(fn ($id, $index) => [$id => ['order' => $index + 1]])
            ->toArray();

        // Sync members with order
        $group->pulseMembers()->sync($syncData);
    }
}
