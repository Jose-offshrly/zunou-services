<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\OrganizationGroup\UpdateOrCreateOrganizationGroupMemberAction;
use App\Models\OrganizationGroup;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

readonly class UpdateOrCreateOrganizationGroupMemberMutation
{
    public function __construct(
        private readonly UpdateOrCreateOrganizationGroupMemberAction $updateOrCreateOrganizationGroupMemberAction,
    ) {
    }

    public function __invoke($_, array $args): Collection
    {
        try {
            $user    = Auth::user();
            $groupId = $args['organizationGroupId'] ?? null;
            if (! $user) {
                throw new Error('no user found!');
            }

            \Log::info(
                'UpdateOrCreateOrganizationGroupMember mutation invoked',
                [
                    'groupId'          => $groupId,
                    'orderedMemberIds' => $args['orderedMemberIds'] ?? [],
                    'user'             => $user->id,
                ],
            );

            $group = $groupId
                ? OrganizationGroup::find($args['organizationGroupId'])
                : null;

            $this->updateOrCreateOrganizationGroupMemberAction->handle(
                group: $group,
                orderedMemberIds: $args['orderedMemberIds'],
            );

            // Get the updated members with their order values
            $updatedMembers = $group
                ? $group
                    ->pulseMembers()
                    ->withPivot('order')
                    ->orderBy('organization_group_pulse_member.order', 'asc')
                    ->get()
                    ->map(function ($member) {
                        // Attach the order directly to the member from pivot
                        $member->order = $member->pivot->order;
                        return $member;
                    })
                : collect([]);

            \Log::info('UpdateOrCreateOrganizationGroupMember completed', [
                'groupId'             => $groupId,
                'updatedMembersCount' => $updatedMembers->count(),
                'memberOrders'        => $updatedMembers
                    ->map(
                        fn ($m) => ['id' => $m->id, 'order' => $m->order ?? null],
                    )
                    ->toArray(),
            ]);

            return $updatedMembers ?? collect([]);
        } catch (\Exception $e) {
            \Log::error('Failed to update pulse org member', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw new Error(
                'Failed to create update pulse org member: ' . $e->getMessage(),
            );
        }
    }
}
