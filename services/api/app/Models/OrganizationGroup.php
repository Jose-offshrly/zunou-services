<?php

namespace App\Models;

use App\Concerns\BelongsToOrganization;
use App\Concerns\BelongsToPulse;
use App\Observers\OrganizationGroupObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;

#[ObservedBy(OrganizationGroupObserver::class)]
class OrganizationGroup extends BaseModel
{
    use BelongsToOrganization;
    use BelongsToPulse;

    public function pulseMembers()
    {
        return $this->belongsToMany(
            PulseMember::class,
            'organization_group_pulse_member',
        )
            ->using(\App\Models\OrganizationGroupPulseMember::class)
            ->withPivot('order')
            ->orderByPivot('order', 'asc');
    }
}
