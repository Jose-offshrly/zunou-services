<?php

namespace App\Actions\Hiatus;

use App\DataTransferObjects\HiatusData;
use App\Models\Hiatus;
use App\Models\User;

class CreateHiatusAction
{
    public function handle(HiatusData $data): Hiatus
    {
        $user = User::findOrFail($data->user_id);
        $hiatus = $this->checkRunningHiatus($user);

        if (! $hiatus) {
            $hiatus = Hiatus::create([
                'user_id'      => $data->user_id,
                'timesheet_id' => $data->timesheet_id,
                'start_at'     => now(),
            ]);
        }

        if ($hiatus) {
            // Open record exists, reset check-out data
            $hiatus->end_at = null;
            $hiatus->total  = null;
            $hiatus->save();
        }

        return $hiatus->refresh();
    }

    private function checkRunningHiatus(User $user): null|Hiatus
    {
        // Check if user already has a hiatus for today and return if there is an existing resource
        $hiatus = Hiatus::where('user_id', $user->id)
            ->whereDate('start_at', today())
            ->first();

        if ($hiatus) {
            if (is_null($hiatus->start_at)) {
                throw new \Error(
                    'You have an active hiatus that needs to be stopped first',
                );
            }
        }

        return $hiatus;
    }
}
