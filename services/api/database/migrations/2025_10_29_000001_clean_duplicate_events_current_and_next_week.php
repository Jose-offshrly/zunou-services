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
        // Use ISO weeks 44 and 45 of the current ISO year
        $isoYear            = Carbon::now()->isoWeekYear;
        $startOfWeek44      = Carbon::now()->setISODate($isoYear, 44)->startOfWeek(Carbon::MONDAY);
        $endOfWeek45        = Carbon::now()->setISODate($isoYear, 45)->endOfWeek(Carbon::SUNDAY);

        // Find duplicate groups within the 2-week window
        $duplicateGroups = DB::table('events')
            ->select(
                'pulse_id',
                DB::raw('DATE(date) as date_day'),
                'user_id',
                'start_at',
                'google_event_id',
                DB::raw('COUNT(*) as cnt')
            )
            ->whereBetween('date', [$startOfWeek44, $endOfWeek45])
            ->groupBy('pulse_id', DB::raw('DATE(date)'), 'user_id', 'start_at', 'google_event_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicateGroups as $group) {
            // Get all IDs for the duplicate group ordered by most recently created first
            $ids = DB::table('events')
                ->select('id')
                ->where('pulse_id', $group->pulse_id)
                ->whereDate('date', $group->date_day)
                ->where('user_id', $group->user_id)
                ->where('start_at', $group->start_at)
                ->when(
                    is_null($group->google_event_id),
                    fn ($q) => $q->whereNull('google_event_id'),
                    fn ($q) => $q->where('google_event_id', $group->google_event_id)
                )
                ->orderBy('created_at', 'desc')
                ->pluck('id')
                ->all();

            // Keep the most recent, soft delete the rest
            if (count($ids) > 1) {
                $idsToDelete = array_slice($ids, 1);
                DB::table('events')->whereIn('id', $idsToDelete)->update(['deleted_at' => Carbon::now()]);
            }
        }
    }
};


