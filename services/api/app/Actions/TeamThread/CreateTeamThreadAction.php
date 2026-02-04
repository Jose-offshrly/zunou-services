<?php

namespace App\Actions\TeamThread;

use App\DataTransferObjects\TeamThreadData;
use App\Models\TeamThread;

class CreateTeamThreadAction
{
    public function handle(TeamThreadData $data): TeamThread
    {
        $teamThread = TeamThread::create([
            'pulse_id'        => $data->pulse_id,
            'organization_id' => $data->organization_id,
        ]);

        return $teamThread->refresh();
    }
}
