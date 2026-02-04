<?php

namespace App\Actions\Integration;

use App\Models\Integration;
use App\Models\Meeting;
use Illuminate\Support\Facades\DB;

class DeleteIntegrationAction
{
    public function handle(Integration $integration): bool
    {
        return DB::transaction(function () use ($integration) {
            Meeting::query()
                ->wherePulseId($integration->pulse_id)
                ->whereUserId($integration->user_id)
                ->whereNull('data_source_id')
                ->delete();

            return $integration->delete();
        });
    }
}
