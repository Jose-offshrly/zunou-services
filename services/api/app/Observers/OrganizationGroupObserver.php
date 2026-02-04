<?php

namespace App\Observers;

use App\Concerns\FeedHandler;
use App\Enums\FeedType;
use App\Models\OrganizationGroup;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class OrganizationGroupObserver
{
    use FeedHandler;

    public function created(OrganizationGroup $organizationGroup): void
    {
        // Check if this is the first OrganizationGroup for the org + pulse
        $firstGroup = OrganizationGroup::where(
            'organization_id',
            $organizationGroup->organization_id,
        )
            ->where('pulse_id', $organizationGroup->pulse_id)
            ->orderBy('id') // assumes auto-incrementing ID
            ->first();

        if (! $firstGroup || $firstGroup->id !== $organizationGroup->id) {
            Log::info('Duplicate Org chart detected. Skipping activity log.');

            return;
        }

        Log::info('First Org chart. Logging activity.');

        // Eager load pulse with members and their users to avoid N+1 queries
        $organizationGroup->load('pulse.members.user');

        foreach ($organizationGroup->pulse->members as $member) {
            $this->recordActivity(
                model: $organizationGroup,
                properties: [
                    'data'   => $organizationGroup->toArray(),
                    'causer' => Auth::user()->only([
                        'id',
                        'name',
                        'email',
                        'gravatar',
                    ]),
                ],
                description: 'Added a Organization Chart - in ' .
                    $organizationGroup->pulse->name .
                    ' the latest team structure. View role, reporting lines, and team groupings',
                feed_type: FeedType::ORGGROUP_CREATED->value,
                organization_id: $organizationGroup->organization_id,
                receiver_id: $member->user->id,
                pulse_id: $organizationGroup->pulse_id,
            );
        }
    }
}
