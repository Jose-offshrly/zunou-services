<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Pulse;
use App\Models\PulseMember;
use Illuminate\Support\Facades\DB;

final readonly class UpdatePulseOrderMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $input        = $args['input'];
        $user         = auth()->user();
        $updatesArray = collect($input)->pluck('order', 'pulseId')->toArray();

        return DB::transaction(function () use ($updatesArray) {
            foreach ($updatesArray as $key => $value) {
                PulseMember::where('pulse_id', $key)
                    ->where('user_id', auth()->id())
                    ->update(['order' => $value]);
            }

            $pulseIds = array_keys($updatesArray);

            // Get saved message counts upfront
            $savedMessageCounts = \App\Models\SavedMessage::query()
                ->join('threads', 'saved_messages.thread_id', '=', 'threads.id')
                ->whereIn('threads.pulse_id', $pulseIds)
                ->selectRaw('threads.pulse_id as pulse_id, count(*) as count')
                ->groupBy('threads.pulse_id')
                ->pluck('count', 'pulse_id');

            $pulses = Pulse::whereIn('id', $pulseIds)
                ->with([
                    'members' => function ($query) {
                        $query->where('user_id', auth()->id());
                    },
                    'members.user',
                    'notifications.users',
                    'threads',
                ])
                ->withCount([
                    'members',
                    'notifications as unread_notifications_count' => function ($query) {
                        $query->where('status', 'pending');
                    },
                ])
                ->get()
                ->each(fn ($pulse) => $pulse->setAttribute('saved_messages_count', $savedMessageCounts[$pulse->id] ?? 0));

            // Sort the pulses according to the updated order
            $orderedPulses = collect($updatesArray)
                ->keys()
                ->map(function ($pulseId) use ($pulses) {
                    return $pulses->firstWhere('id', $pulseId);
                })
                ->filter()
                ->values();

            return $orderedPulses;
        });
    }
}
