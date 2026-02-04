<?php

namespace App\Actions\PulseMember;

use App\Models\PulseMember;

class DeletePulseMemberAction
{
    public function handle(PulseMember $pulseMember): bool
    {
        return $pulseMember->delete();
    }
}
