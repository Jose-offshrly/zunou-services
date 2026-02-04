<?php

namespace App\Actions\FireFlies;

use App\Actions\Shared\FormatUnixTimestampAction;
use App\Events\FireFliesMeetingSynced;
use App\Models\Meeting;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StoreUserFireFliesTranscriptionAction
{
    private array $meetings = [];

    public function handle(
        Collection $transcriptions,
        User $user,
        string $pulseId,
    ): void {
        DB::transaction(function () use ($transcriptions, $user, $pulseId) {
            $transcriptions->each(function ($meeting) use ($user, $pulseId) {
                $date = app(FormatUnixTimestampAction::class)->handle(
                    $meeting->date,
                );

                $meeting = Meeting::firstOrCreate(
                    [
                        'pulse_id'   => $pulseId,
                        'meeting_id' => $meeting->id,
                        'user_id'    => $user->id,
                    ],
                    [
                        'title'     => $meeting->title,
                        'date'      => $date,
                        'organizer' => $meeting->organizer,
                    ],
                );

                $this->meetings[] = $meeting->id;
            });

            Meeting::whereIn('id', $this->meetings)->update([
                'is_viewable' => true,
            ]);

            Log::info(
                'StoreUserFireFliesTranscriptionAction: fireflies meetings saved',
            );
        });
        FirefliesMeetingSynced::dispatch($pulseId);
    }
}
