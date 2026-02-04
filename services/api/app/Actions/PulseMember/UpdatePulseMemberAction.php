<?php

declare(strict_types=1);

namespace App\Actions\PulseMember;

use App\DataTransferObjects\PulseMemberData;
use App\Models\PulseMember;

final class UpdatePulseMemberAction
{
    public function handle(
        PulseMemberData $data,
        PulseMember $member,
    ): PulseMember {
        $member->update([
            'job_description'  => $data->job_description,
            'responsibilities' => $data->responsibilities,
        ]);

        return $member->refresh();
    }
}
