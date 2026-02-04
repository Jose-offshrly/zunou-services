<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class OrganizationGroupPulseMember extends Pivot
{
    protected $table = 'organization_group_pulse_member';

    protected $guarded = [];
}
