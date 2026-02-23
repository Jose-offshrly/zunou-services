<?php

declare(strict_types=1);

namespace App\Actions\RecurringEvent;

use App\DataTransferObjects\RecurringEventInstanceSetupData;
use App\Models\RecurringEventInstanceSetup;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SetupRecurringEventInstanceAction
{
    /**
     * Create or update a recurring event setup for a specific pulse.
     * Uses updateOrCreate to ensure idempotency on the (recurring_event, pulse) pair.
     */
    public function handle(RecurringEventInstanceSetupData $data): RecurringEventInstanceSetup
    {
        return DB::transaction(function () use ($data) {
            $setup = RecurringEventInstanceSetup::updateOrCreate(
                [
                    'recurring_event_id' => $data->recurring_event_id,
                    'pulse_id'           => $data->pulse_id,
                ],
                [
                    'invite_notetaker' => $data->invite_notetaker,
                    'setting'          => $data->setting,
                ]
            );

            Log::info('Setup recurring event for pulse', [
                'recurring_event_id' => $data->recurring_event_id,
                'pulse_id'           => $data->pulse_id,
                'invite_notetaker'   => $data->invite_notetaker,
            ]);

            return $setup;
        });
    }
}
