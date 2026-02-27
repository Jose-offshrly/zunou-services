<?php

declare(strict_types=1);

namespace App\Actions\PulseMember;

use App\DataTransferObjects\PulseMemberData;
use App\Models\PulseMember;
use App\Services\CacheService;

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

        // Clear Lighthouse cache BEFORE returning to ensure fresh data in response
        // (Observer clears cache after commit, which is too late for the response)
        CacheService::clearLighthouseCache('PulseMember', $member->id);

        return $member->refresh();
    }
}
