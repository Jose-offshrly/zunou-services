<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Clean duplicates from week 46 onwards
        // DO NOT delete events that have any meeting session linked
        $isoYear       = Carbon::now()->isoWeekYear;
        $startOfWeek46 = Carbon::now()->setISODate($isoYear, 46)->startOfWeek(Carbon::MONDAY);

        $duplicateGroups = DB::table('events')
            ->select(
                'pulse_id',
                DB::raw('DATE(date) as date_day'),
                'user_id',
                'start_at',
                'google_event_id',
                DB::raw('COUNT(*) as cnt')
            )
            ->where('date', '>=', $startOfWeek46)
            ->whereNull('deleted_at')
            ->groupBy('pulse_id', DB::raw('DATE(date)'), 'user_id', 'start_at', 'google_event_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicateGroups as $group) {
            // Fetch all IDs for this duplicate group
            // Only process if we have actual duplicates (count > 1)
            $ids = DB::table('events')
                ->select('id')
                ->where('pulse_id', $group->pulse_id)
                ->whereDate('date', $group->date_day)
                ->where('user_id', $group->user_id)
                ->where('start_at', $group->start_at)
                ->whereNull('deleted_at')
                ->when(
                    is_null($group->google_event_id),
                    fn ($q) => $q->whereNull('google_event_id'),
                    fn ($q) => $q->where('google_event_id', $group->google_event_id)
                )
                ->orderBy('created_at', 'desc')
                ->pluck('id')
                ->all();

            // Double-check: Only delete if we have actual duplicates (at least 2 events)
            if (count($ids) <= 1) {
                continue;
            }

            $idsToDelete = array_slice($ids, 1);

            // Exclude any events that have meeting sessions
            // - direct FK meeting_sessions.event_id
            // - pivot table event_meeting_session.event_id
            // - current_meeting_session_id on events
            $protectedViaDirect = DB::table('meeting_sessions')
                ->whereIn('event_id', $idsToDelete)
                ->pluck('event_id')
                ->all();

            $protectedViaPivot = DB::table('event_meeting_session')
                ->whereIn('event_id', $idsToDelete)
                ->pluck('event_id')
                ->all();

            $protectedViaCurrent = DB::table('events')
                ->whereIn('id', $idsToDelete)
                ->whereNotNull('current_meeting_session_id')
                ->pluck('id')
                ->all();

            $protectedIds = array_unique(array_merge($protectedViaDirect, $protectedViaPivot, $protectedViaCurrent));
            $finalIdsToDelete = array_values(array_diff($idsToDelete, $protectedIds));

            if (! empty($finalIdsToDelete)) {
                DB::table('events')->whereIn('id', $finalIdsToDelete)->update(['deleted_at' => Carbon::now()]);
            }
        }
    }
};

