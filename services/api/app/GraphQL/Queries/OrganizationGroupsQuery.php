<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\OrganizationGroup;
use App\Models\PulseMember;

final readonly class OrganizationGroupsQuery
{
    /** @param  array{pulseId: string}  $args */
    public function __invoke(null $_, array $args)
    {
        $pulseId = $args['pulseId'];

        // Get all organization groups for the pulse with nested eager loading
        // Include pulse.members.user to prevent N+1 in Pulse::getNameAttribute for ONETOONE pulses
        $organizationGroups = OrganizationGroup::where('pulse_id', $pulseId)
            ->with([
                'pulse.members.user',
                'organization',
                'pulseMembers',
                'pulseMembers.user',
                'pulseMembers.organizationUser',
            ])
            ->orderBy('created_at', 'asc')
            ->get();

        // Get all pulse members for the pulse with eager loading to prevent N+1
        // Include pulse.members.user to prevent N+1 in Pulse::getNameAttribute for ONETOONE pulses
        $allPulseMembers = PulseMember::where('pulse_id', $pulseId)
            ->with(['pulse.members.user', 'user', 'organizationUser'])
            ->orderBy('created_at', 'asc')
            ->get();

        // Preload one-to-one pulse data to prevent N+1 for the one_to_one field
        PulseMember::preloadOneToOnePulses($allPulseMembers);

        // Collect all pulse member IDs that are already assigned to a group
        $assignedMemberIds = $organizationGroups
            ->flatMap(fn ($group) => $group->pulseMembers->pluck('id'))
            ->unique();

        // Find pulse members not assigned to any group
        $unassignedPulseMembers = $allPulseMembers->whereNotIn(
            'id',
            $assignedMemberIds,
        );

        // Preload one-to-one data for group pulse members as well
        $groupPulseMembers = $organizationGroups->flatMap(fn ($group) => $group->pulseMembers);
        PulseMember::preloadOneToOnePulses($groupPulseMembers);

        // Optionally, you can return both groups and unassigned members
        return [
            'organizationGroups'     => $organizationGroups,
            'unassignedPulseMembers' => $unassignedPulseMembers->values(),
        ];
    }
}
